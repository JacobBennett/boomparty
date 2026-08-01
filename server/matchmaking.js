const { Game } = require('./entity/game');
const { COUNTDOWN_SECONDS, ROUND_TIME_MS, WIN_DELAY_MS } = require('./constants');

// Single-queue matchmaking, modeled on the original deployed game:
// everyone who connects joins the same game. While a game is running,
// late joiners become observers. When the game ends everything resets.

let io = null;

let currentGame    = null;
let countdownTimer = null;
let countdownLeft  = 0;
let roundTimer     = null;
let bombTimers     = new Set();

function log(socket, event, message) {
  console.log('==>#' + event + '# [User:' + socket.id + '] ' + message);
}

function playersPayload() {
  return Object.values(currentGame.players).map(player => ({
    id: player.id,
    name: player.name,
    profilePictureSmall: player.profilePictureSmall
  }))
}

const Matchmaking = {
  init: function(serverSocket) {
    io = serverSocket;
  },

  onEnterGame: function(socket, { name } = {}) {
    let playerName = String(name || 'Anonymous').trim().slice(0, 16) || 'Anonymous';

    if (currentGame && currentGame.state === 'running') {
      log(socket, 'enter-game', 'Game in progress, joining as observer');
      socket.data.role = 'observer';
      socket.join(currentGame.id);
      socket.emit('observe-game', { game: currentGame.payload({ forObserver: true }) });
      return
    }

    if (!currentGame) {
      currentGame = new Game();
      console.log('==>#game# New game created [Game:' + currentGame.id + '][Map:' + currentGame.map_name + ']');
    }

    if (currentGame.isFull()) {
      // No spawn left: they watch this round and play the next one.
      log(socket, 'enter-game', 'Game is full, will observe once it starts');
      socket.data.role = 'observer';
      socket.join(currentGame.id);
      return
    }

    socket.data.role = 'player';
    socket.data.playerName = playerName;
    socket.join(currentGame.id);
    currentGame.addPlayer(socket.id, playerName);
    log(socket, 'enter-game', 'Player "' + playerName + '" joined the queue (' + currentGame.playersCount() + '/' + currentGame.max_players + ')');

    if (currentGame.state === 'pending' && currentGame.playersCount() >= 2) {
      Matchmaking.startCountdown();
    } else if (currentGame.state === 'countdown') {
      Matchmaking.broadcastCountdown();
    }
  },

  onForceStart: function(socket) {
    if (!currentGame || currentGame.state !== 'pending') { return }
    if (socket.data.role !== 'player') { return }

    log(socket, 'force-start', 'Player forces the game start');
    Matchmaking.startCountdown();
  },

  startCountdown: function() {
    currentGame.state = 'countdown';
    countdownLeft = COUNTDOWN_SECONDS;
    Matchmaking.broadcastCountdown();

    countdownTimer = setInterval(function() {
      countdownLeft -= 1;

      if (countdownLeft <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        Matchmaking.startGame();
        return
      }

      Matchmaking.broadcastCountdown();
    }, 1000);
  },

  cancelCountdown: function() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    currentGame.state = 'pending';
    io.sockets.in(currentGame.id).emit('waiting-for-players');
  },

  broadcastCountdown: function() {
    io.sockets.in(currentGame.id).emit('start-game-countdown', {
      countdown: countdownLeft,
      players: playersPayload()
    });
  },

  startGame: function() {
    let game = currentGame;
    game.state = 'running';
    game.round_ends_at = Date.now() + ROUND_TIME_MS;
    console.log('##>start-game [Game:' + game.id + '] Game starts with ' + game.playersCount() + ' player(s)');

    io.sockets.in(game.id).fetchSockets().then(function(sockets) {
      for (let member of sockets) {
        if (member.data.role === 'player' && game.players[member.id]) {
          member.emit('start-game', { game: game.payload() });
        } else {
          member.data.role = 'observer';
          member.emit('observe-game', { game: game.payload({ forObserver: true }) });
        }
      }
    });

    roundTimer = setTimeout(function() {
      if (currentGame !== game || game.state !== 'running') { return }

      console.log('##>timer-ended [Game:' + game.id + '] Round time is up');
      io.sockets.in(game.id).emit('timer-ended');
      Matchmaking.finishGame(game);
    }, ROUND_TIME_MS);
  },

  onPositionUpdate: function(socket, { x, y }) {
    let player = Matchmaking.runningPlayer(socket);
    if (!player) { return }

    player.position = { x: x, y: y };
    socket.broadcast.to(currentGame.id).emit('player-position-changed', { playerId: socket.id, x: x, y: y });
  },

  onBombCreate: function(socket, { col, row }) {
    let player = Matchmaking.runningPlayer(socket);
    if (!player || !player.canPlaceBomb()) { return }

    let game = currentGame;
    let bomb = game.addBomb({ ownerId: socket.id, col: col, row: row, power: player.power });
    if (!bomb) { return }

    player.activeBombs += 1;

    io.sockets.in(game.id).emit('bomb-show', { id: bomb.id, ownerId: bomb.ownerId, col: bomb.col, row: bomb.row });

    let timer = setTimeout(function() {
      bombTimers.delete(timer);
      if (currentGame !== game || game.state !== 'running') { return }

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

      io.sockets.in(game.id).emit('bomb-detonate', { id: bomb.id, blastedCells: blastedCells });

      if (destroyedSpoils.length > 0) {
        io.sockets.in(game.id).emit('spoil-destroy', { spoils: destroyedSpoils });
      }
    }, bomb.explosion_time);

    bombTimers.add(timer);
  },

  onSpoilPickUp: function(socket, { spoilId }) {
    let player = Matchmaking.runningPlayer(socket);
    if (!player) { return }

    let spoil = currentGame.findSpoil(spoilId);
    if (!spoil) { return }

    currentGame.deleteSpoil(spoil.id);
    player.pickSpoil(spoil.spoilType);

    io.sockets.in(currentGame.id).emit('spoil-picked-up', {
      playerId: player.id,
      spoilId: spoil.id,
      spoilType: spoil.spoilType
    });
  },

  onPlayerDead: function(socket, { col, row }) {
    let player = Matchmaking.runningPlayer(socket);
    if (!player || !player.isAlive) { return }

    console.log('##>bones-show [Game:' + currentGame.id + '] Player "' + player.name + '" died at [' + col + ',' + row + ']');
    player.dead();

    io.sockets.in(currentGame.id).emit('bones-show', { playerId: player.id, col: col, row: row });

    Matchmaking.checkWin();
  },

  onDisconnect: function(socket) {
    if (!currentGame) { return }

    if (socket.data.role === 'observer') { return }
    if (socket.data.role !== 'player') { return }

    let game = currentGame;
    let player = game.players[socket.id];
    if (!player) { return }

    if (game.state === 'running') {
      console.log('##>player-left [Game:' + game.id + '] Player "' + player.name + '" left the running game');
      let wasAlive = player.isAlive;
      player.dead();
      delete game.players[socket.id];

      io.sockets.in(game.id).emit('player-left', { playerId: socket.id, playerName: player.name });

      if (wasAlive) { Matchmaking.checkWin() }
      return
    }

    // pending / countdown
    game.removePlayer(socket.id);
    console.log('==>#leave# [User:' + socket.id + '] Player "' + player.name + '" left the queue (' + game.playersCount() + '/' + game.max_players + ')');

    if (game.isEmpty()) {
      Matchmaking.resetGame();
      return
    }

    if (game.state === 'countdown') {
      if (game.playersCount() < 2) {
        Matchmaking.cancelCountdown();
      } else {
        Matchmaking.broadcastCountdown();
      }
    }
  },

  checkWin: function() {
    let game = currentGame;
    let alive = game.alivePlayers();

    if (alive.length >= 2) { return }

    let winner = alive[0] || null;

    setTimeout(function() {
      if (currentGame !== game) { return }

      let label = winner ? 'Player "' + winner.name + '" won' : 'Everybody died';
      console.log('##>player-won [Game:' + game.id + '] ' + label);

      io.sockets.in(game.id).emit('player-won', {
        playerId: winner ? winner.id : null,
        name: winner ? winner.name : null
      });

      Matchmaking.finishGame(game);
    }, WIN_DELAY_MS);
  },

  finishGame: function(game) {
    if (currentGame !== game) { return }
    game.state = 'finished';
    Matchmaking.resetGame();
  },

  resetGame: function() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
    if (roundTimer) { clearTimeout(roundTimer); roundTimer = null }
    for (let timer of bombTimers) { clearTimeout(timer) }
    bombTimers.clear();

    if (currentGame) {
      let roomId = currentGame.id;
      io.sockets.in(roomId).socketsLeave(roomId);
    }

    currentGame = null;
  },

  runningPlayer: function(socket) {
    if (!currentGame || currentGame.state !== 'running') { return null }
    return currentGame.players[socket.id] || null
  }
}

module.exports = Matchmaking;
