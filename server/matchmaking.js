const Rooms = require('./rooms');
const { Game } = require('./entity/game');
const { COUNTDOWN_SECONDS, ROUND_TIME_MS, WIN_DELAY_MS } = require('./constants');

// Room-based matchmaking: every game lives in a room with a shareable code.
// The first player creates the room and hosts; everyone else joins by code
// (invite link). Rooms persist across rounds for rematches — sockets stay in
// the room's channel until they disconnect — and die when the last one leaves.

let io = null;

function log(socket, event, message) {
  console.log('==>#' + event + '# [User:' + socket.id + '] ' + message);
}

function sanitizeName(name) {
  return String(name || 'Anonymous').trim().slice(0, 16) || 'Anonymous'
}

function playersPayload(game) {
  return Object.values(game.players).map(player => ({
    id: player.id,
    name: player.name,
    profilePictureSmall: player.profilePictureSmall
  }))
}

function lobbyPayload(room) {
  return {
    roomCode: room.code,
    hostId: room.game.hostId,
    maxPlayers: room.game.max_players,
    players: playersPayload(room.game)
  }
}

function roomOf(socket) {
  return socket.data.roomCode ? Rooms.getRoom(socket.data.roomCode) : null
}

const Matchmaking = {
  init: function(serverSocket) {
    io = serverSocket;
  },

  onCreateRoom: function(socket, { name } = {}) {
    if (roomOf(socket)) { return } // one room per connection

    let room = Rooms.createRoom();
    let playerName = sanitizeName(name);

    socket.data.role = 'player';
    socket.data.playerName = playerName;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    room.game.addPlayer(socket.id, playerName);
    room.game.hostId = socket.id;

    log(socket, 'create-room', 'Player "' + playerName + '" created room ' + room.code + ' (' + Rooms.roomsCount() + ' active)');
    Matchmaking.broadcastLobby(room);
  },

  onJoinRoom: function(socket, { roomCode, name } = {}) {
    let code = String(roomCode || '').trim().toUpperCase();
    let room = Rooms.getRoom(code);
    if (!room) {
      log(socket, 'join-room', 'Room "' + code + '" not found');
      socket.emit('room-not-found', { roomCode: code });
      return
    }

    let current = roomOf(socket);
    if (current && current !== room) { return } // one room per connection

    let game = room.game;

    // Rematch rejoins re-enter through here while still in the channel;
    // a duplicate join for the same game is just answered with the roster.
    if (game.players[socket.id]) {
      Matchmaking.broadcastLobby(room);
      return
    }

    let playerName = sanitizeName(name);
    socket.data.playerName = playerName;
    socket.data.roomCode = room.code;
    socket.join(room.code);

    if (game.state === 'running') {
      log(socket, 'join-room', 'Room ' + room.code + ' in progress, joining as observer');
      socket.data.role = 'observer';
      socket.emit('observe-game', { roomCode: room.code, game: game.payload({ forObserver: true }) });
      return
    }

    if (game.isFull()) {
      // No spawn left: they watch this round and play the next one. They still
      // get the roster; their own id being absent tells them the room is full.
      log(socket, 'join-room', 'Room ' + room.code + ' is full, will observe once it starts');
      socket.data.role = 'observer';
      socket.emit('lobby-update', lobbyPayload(room));
      return
    }

    socket.data.role = 'player';
    game.addPlayer(socket.id, playerName);
    if (!game.hostId) { game.hostId = socket.id }
    log(socket, 'join-room', 'Player "' + playerName + '" joined room ' + room.code + ' (' + game.playersCount() + '/' + game.max_players + ')');

    if (game.state === 'countdown') {
      Matchmaking.broadcastCountdown(room);
    } else {
      Matchmaking.broadcastLobby(room);
    }
  },

  onHostStart: function(socket) {
    let room = roomOf(socket);
    if (!room || room.game.state !== 'pending') { return }
    if (socket.id !== room.game.hostId) { return }

    log(socket, 'host-start', 'Host starts the game in room ' + room.code);
    Matchmaking.startCountdown(room);
  },

  promoteHost: function(game) {
    // Object key order is insertion order, so this is the earliest joiner.
    game.hostId = Object.keys(game.players)[0] || null;
  },

  broadcastLobby: function(room) {
    io.sockets.in(room.code).emit('lobby-update', lobbyPayload(room));
  },

  startCountdown: function(room) {
    room.game.state = 'countdown';
    room.countdownLeft = COUNTDOWN_SECONDS;
    Matchmaking.broadcastCountdown(room);

    room.countdownTimer = setInterval(function() {
      if (Rooms.getRoom(room.code) !== room) { clearInterval(room.countdownTimer); return }

      room.countdownLeft -= 1;

      if (room.countdownLeft <= 0) {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
        Matchmaking.startGame(room);
        return
      }

      Matchmaking.broadcastCountdown(room);
    }, 1000);
  },

  broadcastCountdown: function(room) {
    io.sockets.in(room.code).emit('start-game-countdown', {
      roomCode: room.code,
      countdown: room.countdownLeft,
      hostId: room.game.hostId,
      maxPlayers: room.game.max_players,
      players: playersPayload(room.game)
    });
  },

  startGame: function(room) {
    let game = room.game;
    game.state = 'running';
    game.round_ends_at = Date.now() + ROUND_TIME_MS;
    console.log('##>start-game [Room:' + room.code + '] Game starts with ' + game.playersCount() + ' player(s)');

    io.sockets.in(room.code).fetchSockets().then(function(sockets) {
      for (let member of sockets) {
        if (member.data.role === 'player' && game.players[member.id]) {
          member.emit('start-game', { game: game.payload() });
        } else {
          member.data.role = 'observer';
          member.emit('observe-game', { roomCode: room.code, game: game.payload({ forObserver: true }) });
        }
      }
    });

    room.roundTimer = setTimeout(function() {
      if (Rooms.getRoom(room.code) !== room || room.game !== game || game.state !== 'running') { return }

      console.log('##>timer-ended [Room:' + room.code + '] Round time is up');
      io.sockets.in(room.code).emit('timer-ended');
      Matchmaking.finishRound(room);
    }, ROUND_TIME_MS);
  },

  onPositionUpdate: function(socket, { x, y }) {
    let running = Matchmaking.runningPlayer(socket);
    if (!running) { return }

    running.player.position = { x: x, y: y };
    socket.broadcast.to(running.room.code).emit('player-position-changed', { playerId: socket.id, x: x, y: y });
  },

  onBombCreate: function(socket, { col, row }) {
    let running = Matchmaking.runningPlayer(socket);
    if (!running || !running.player.canPlaceBomb()) { return }

    let { room, game, player } = running;
    let bomb = game.addBomb({ ownerId: socket.id, col: col, row: row, power: player.power });
    if (!bomb) { return }

    player.activeBombs += 1;

    io.sockets.in(room.code).emit('bomb-show', { id: bomb.id, ownerId: bomb.ownerId, col: bomb.col, row: bomb.row });

    let timer = setTimeout(function() {
      room.bombTimers.delete(bomb.id);
      Matchmaking.detonateBomb(room, game, bomb);
    }, bomb.explosion_time);

    room.bombTimers.set(bomb.id, timer);
  },

  detonateBomb: function(room, game, bomb) {
    if (Rooms.getRoom(room.code) !== room || room.game !== game || game.state !== 'running') { return }
    if (!game.bombs.has(bomb.id)) { return } // already went off earlier in this chain

    let timer = room.bombTimers.get(bomb.id);
    if (timer) {
      clearTimeout(timer);
      room.bombTimers.delete(bomb.id);
    }

    let owner = game.players[bomb.ownerId];
    if (owner && owner.activeBombs > 0) { owner.activeBombs -= 1 }

    let blastedCells = bomb.detonate();
    game.removeBomb(bomb);

    // Spoils lying in the blast path (not the freshly revealed ones) burn up.
    let destroyedSpoils = [];
    for (let cell of blastedCells) {
      if (cell.destroyed) { continue }

      let spoil = game.findSpoilAt(cell.row, cell.col);
      if (spoil) {
        game.deleteSpoil(spoil.id);
        destroyedSpoils.push({ id: spoil.id });
      }
    }

    io.sockets.in(room.code).emit('bomb-detonate', { id: bomb.id, blastedCells: blastedCells });

    if (destroyedSpoils.length > 0) {
      io.sockets.in(room.code).emit('spoil-destroy', { spoils: destroyedSpoils });
    }

    // Chain reaction: any bomb standing in the blast goes off immediately.
    for (let cell of blastedCells) {
      let other = game.findBombAt(cell.row, cell.col);
      if (other) { Matchmaking.detonateBomb(room, game, other) }
    }
  },

  onSpoilPickUp: function(socket, { spoilId }) {
    let running = Matchmaking.runningPlayer(socket);
    if (!running) { return }

    let { room, game, player } = running;
    let spoil = game.findSpoil(spoilId);
    if (!spoil) { return }

    game.deleteSpoil(spoil.id);
    player.pickSpoil(spoil.spoilType);

    io.sockets.in(room.code).emit('spoil-picked-up', {
      playerId: player.id,
      spoilId: spoil.id,
      spoilType: spoil.spoilType
    });
  },

  onPlayerDead: function(socket, { col, row }) {
    let running = Matchmaking.runningPlayer(socket);
    if (!running || !running.player.isAlive) { return }

    let { room, player } = running;
    console.log('##>bones-show [Room:' + room.code + '] Player "' + player.name + '" died at [' + col + ',' + row + ']');
    player.dead();

    io.sockets.in(room.code).emit('bones-show', { playerId: player.id, col: col, row: row });

    Matchmaking.checkWin(room);
  },

  onDisconnect: function(socket) {
    let room = roomOf(socket);
    if (!room) { return }

    let game = room.game;
    let player = game.players[socket.id];

    if (player && game.state === 'running') {
      console.log('##>player-left [Room:' + room.code + '] Player "' + player.name + '" left the running game');
      let wasAlive = player.isAlive;
      player.dead();
      delete game.players[socket.id];

      io.sockets.in(room.code).emit('player-left', { playerId: socket.id, playerName: player.name });

      if (wasAlive) { Matchmaking.checkWin(room) }
    } else if (player) {
      // pending / countdown
      game.removePlayer(socket.id);
      console.log('==>#leave# [User:' + socket.id + '] Player "' + player.name + '" left room ' + room.code + ' (' + game.playersCount() + '/' + game.max_players + ')');

      if (socket.id === game.hostId) {
        Matchmaking.promoteHost(game);
      }

      if (game.playersCount() > 0) {
        // Once the host commits, the countdown always runs to completion.
        if (game.state === 'countdown') {
          Matchmaking.broadcastCountdown(room);
        } else {
          Matchmaking.broadcastLobby(room);
        }
      }
    }

    // Room lifecycle: by the time this handler runs the socket has already
    // left its channels, so an empty channel means the room is truly empty.
    let channel = io.sockets.adapter.rooms.get(room.code);
    if (!channel || channel.size === 0) {
      Rooms.deleteRoom(room);
      console.log('==>#room# Room ' + room.code + ' emptied and deleted (' + Rooms.roomsCount() + ' active)');
      return
    }

    // Pending game emptied but observers are still waiting: give them the room.
    if (game.playersCount() === 0 && game.state !== 'running') {
      Matchmaking.resetRoom(room);
      Matchmaking.seatObservers(room);
    }
  },

  seatObservers: function(room) {
    io.sockets.in(room.code).fetchSockets().then(function(sockets) {
      if (Rooms.getRoom(room.code) !== room) { return }

      for (let member of sockets) {
        if (member.data.role !== 'observer') { continue }
        if (room.game.isFull()) { break }

        member.data.role = 'player';
        room.game.addPlayer(member.id, member.data.playerName || 'Anonymous');
        if (!room.game.hostId) { room.game.hostId = member.id }
      }

      Matchmaking.broadcastLobby(room);
    });
  },

  checkWin: function(room) {
    let game = room.game;
    let alive = game.alivePlayers();

    if (alive.length >= 2) { return }

    let winner = alive[0] || null;

    setTimeout(function() {
      if (Rooms.getRoom(room.code) !== room || room.game !== game) { return }

      let label = winner ? 'Player "' + winner.name + '" won' : 'Everybody died';
      console.log('##>player-won [Room:' + room.code + '] ' + label);

      io.sockets.in(room.code).emit('player-won', {
        playerId: winner ? winner.id : null,
        name: winner ? winner.name : null
      });

      Matchmaking.finishRound(room);
    }, WIN_DELAY_MS);
  },

  finishRound: function(room) {
    room.game.state = 'finished';
    Matchmaking.resetRoom(room);
  },

  resetRoom: function(room) {
    Rooms.clearRoomTimers(room);
    room.game = new Game();
    console.log('==>#room# Room ' + room.code + ' reset for a rematch');
  },

  runningPlayer: function(socket) {
    let room = roomOf(socket);
    if (!room || room.game.state !== 'running') { return null }

    let player = room.game.players[socket.id] || null;
    return player ? { room: room, game: room.game, player: player } : null
  }
}

module.exports = Matchmaking;
