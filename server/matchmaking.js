const Rooms = require('./rooms');
const { Game } = require('./entity/game');
const {
  COUNTDOWN_SECONDS, WIN_DELAY_MS, INTERMISSION_SECONDS,
  ROUNDS_MIN, ROUNDS_MAX, DEFAULT_ROUNDS,
  ROUND_TIME_MIN_S, ROUND_TIME_MAX_S, DEFAULT_ROUND_TIME_S
} = require('./constants');

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

function clampSetting(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback
}

function scoresPayload(room) {
  return Object.entries(room.scores).map(([id, row]) => ({ id: id, name: row.name, wins: row.wins }))
}

function matchPayload(room) {
  return {
    currentRound: room.currentRound,
    totalRounds: room.settings.rounds,
    scores: scoresPayload(room)
  }
}

function ensureScoreRows(room) {
  for (let player of Object.values(room.game.players)) {
    if (!room.scores[player.id]) {
      room.scores[player.id] = { name: player.name, wins: 0 };
    }
  }
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
      socket.emit('observe-game', { roomCode: room.code, game: game.payload({ forObserver: true }), match: room.settings ? matchPayload(room) : null });
      return
    }

    if (game.state === 'intermission') {
      // Between rounds: wait out the window; startNextRound seats them if a
      // spawn is free, otherwise they observe the next round.
      log(socket, 'join-room', 'Room ' + room.code + ' between rounds, waiting for the next one');
      socket.data.role = 'observer';
      socket.emit('wait-next-round', {
        roomCode: room.code,
        currentRound: room.currentRound,
        totalRounds: room.settings.rounds,
        nextRoundInMs: Math.max(0, room.intermissionEndsAt - Date.now())
      });
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

  onHostStart: function(socket, { rounds, roundTime } = {}) {
    let room = roomOf(socket);
    if (!room || room.game.state !== 'pending') { return }
    if (socket.id !== room.game.hostId) { return }

    room.settings = {
      rounds: clampSetting(rounds, ROUNDS_MIN, ROUNDS_MAX, DEFAULT_ROUNDS),
      roundTime: clampSetting(roundTime, ROUND_TIME_MIN_S, ROUND_TIME_MAX_S, DEFAULT_ROUND_TIME_S)
    };
    room.currentRound = 0;
    room.scores = {};

    log(socket, 'host-start', 'Host starts a ' + room.settings.rounds + '-round match (' + room.settings.roundTime + 's rounds) in room ' + room.code);
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

  // Starts one round of the current match.
  startGame: function(room) {
    let game = room.game;
    let roundMs = room.settings.roundTime * 1000;
    room.currentRound += 1;
    game.state = 'running';
    game.round_ends_at = Date.now() + roundMs;
    ensureScoreRows(room);
    console.log('##>start-game [Room:' + room.code + '] Round ' + room.currentRound + '/' + room.settings.rounds + ' starts with ' + game.playersCount() + ' player(s)');

    io.sockets.in(room.code).fetchSockets().then(function(sockets) {
      for (let member of sockets) {
        if (member.data.role === 'player' && game.players[member.id]) {
          member.emit('start-game', { game: game.payload(), match: matchPayload(room) });
        } else {
          member.data.role = 'observer';
          member.emit('observe-game', { roomCode: room.code, game: game.payload({ forObserver: true }), match: matchPayload(room) });
        }
      }
    });

    room.roundTimer = setTimeout(function() {
      if (Rooms.getRoom(room.code) !== room || room.game !== game || game.state !== 'running') { return }

      console.log('##>timer-ended [Room:' + room.code + '] Round time is up');
      io.sockets.in(room.code).emit('timer-ended');
      Matchmaking.endRound(room, null, { timeUp: true });
    }, roundMs);
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
    } else if (player && game.state === 'intermission') {
      // The old round's game is dead; just drop them so the next-round seating
      // skips them. startNextRound re-derives the host from actually-seated players.
      delete game.players[socket.id];
      console.log('==>#leave# [User:' + socket.id + '] Player "' + player.name + '" left room ' + room.code + ' between rounds');
      if (socket.id === game.hostId) {
        Matchmaking.promoteHost(game);
      }
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
    // (Not during intermission — the intermission timer will seat them itself.)
    if (game.playersCount() === 0 && (game.state === 'pending' || game.state === 'countdown')) {
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

      let label = winner ? 'Player "' + winner.name + '" won round ' + room.currentRound : 'Everybody died in round ' + room.currentRound;
      console.log('##>player-won [Room:' + room.code + '] ' + label);

      if (winner) {
        if (!room.scores[winner.id]) { room.scores[winner.id] = { name: winner.name, wins: 0 } }
        room.scores[winner.id].wins += 1;
      }

      io.sockets.in(room.code).emit('player-won', {
        playerId: winner ? winner.id : null,
        name: winner ? winner.name : null
      });

      Matchmaking.endRound(room, winner, { timeUp: false });
    }, WIN_DELAY_MS);
  },

  endRound: function(room, winner, { timeUp }) {
    if (room.currentRound < room.settings.rounds) {
      Matchmaking.beginIntermission(room, winner, { timeUp: timeUp });
    } else {
      Matchmaking.endMatch(room, winner, { timeUp: timeUp });
    }
  },

  beginIntermission: function(room, winner, { timeUp }) {
    let game = room.game;
    game.state = 'intermission';

    // Round-scoped timers only; the intermission timer below must survive.
    if (room.roundTimer) { clearTimeout(room.roundTimer); room.roundTimer = null }
    for (let timer of room.bombTimers.values()) { clearTimeout(timer) }
    room.bombTimers.clear();

    io.sockets.in(room.code).emit('round-ended', {
      winnerName: winner ? winner.name : null,
      timeUp: timeUp,
      scores: scoresPayload(room),
      currentRound: room.currentRound,
      totalRounds: room.settings.rounds,
      nextRoundIn: INTERMISSION_SECONDS
    });

    room.intermissionEndsAt = Date.now() + INTERMISSION_SECONDS * 1000;
    room.intermissionTimer = setTimeout(function() {
      room.intermissionTimer = null;
      if (Rooms.getRoom(room.code) !== room || room.game !== game) { return }
      Matchmaking.startNextRound(room);
    }, INTERMISSION_SECONDS * 1000);
  },

  // Re-seats everyone still connected into a fresh Game — clients never
  // re-emit join-room between rounds; they just receive the next start-game.
  startNextRound: function(room) {
    let oldGame = room.game;
    let newGame = new Game();

    io.sockets.in(room.code).fetchSockets().then(function(sockets) {
      if (Rooms.getRoom(room.code) !== room || room.game !== oldGame) { return }

      let connected = new Map(sockets.map(member => [member.id, member]));

      // Previous players first (in their original join order), then waiting
      // observers, until the map runs out of spawns.
      let candidates = [];
      for (let id of Object.keys(oldGame.players)) {
        if (connected.has(id)) { candidates.push(connected.get(id)) }
      }
      for (let member of sockets) {
        if (!oldGame.players[member.id]) { candidates.push(member) }
      }

      for (let member of candidates) {
        if (newGame.isFull()) { member.data.role = 'observer'; continue }
        member.data.role = 'player';
        newGame.addPlayer(member.id, member.data.playerName || 'Anonymous');
      }

      if (oldGame.hostId && newGame.players[oldGame.hostId]) {
        newGame.hostId = oldGame.hostId;
      } else {
        newGame.hostId = Object.keys(newGame.players)[0] || null;
      }

      room.game = newGame;
      Matchmaking.startGame(room);
    });
  },

  endMatch: function(room, lastWinner, { timeUp }) {
    let standings = scoresPayload(room).sort((a, b) => b.wins - a.wins);
    let maxWins = standings.length ? standings[0].wins : 0;
    let tie = standings.filter(row => row.wins === maxWins).length !== 1;

    console.log('##>match-ended [Room:' + room.code + '] ' + (tie ? 'Match tied' : 'Player "' + standings[0].name + '" wins the match'));

    io.sockets.in(room.code).emit('match-ended', {
      standings: standings,
      matchWinnerName: tie ? null : standings[0].name,
      tie: tie,
      lastWinnerName: lastWinner ? lastWinner.name : null,
      timeUp: timeUp
    });

    room.game.state = 'finished';
    Matchmaking.resetRoom(room);
  },

  resetRoom: function(room) {
    Rooms.clearRoomTimers(room);
    room.game = new Game();
    room.settings = null;
    room.currentRound = 0;
    room.scores = {};
    room.intermissionEndsAt = 0;
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
