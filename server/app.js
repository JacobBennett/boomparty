const express = require('express');
const socketIO = require('socket.io');
const favicon = require('serve-favicon');

const app = express();
const server = require('http').createServer(app);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(favicon(path.join(__dirname, '..', 'client', 'favicon.ico')));

// Serve runtime libraries straight from node_modules.
const nm_dependencies = ['phaser'];
nm_dependencies.forEach(dep => {
  app.use(`/${dep}`, express.static(path.join(__dirname, '..', 'node_modules', dep)));
});

server.listen(PORT, function(){
  console.log(`Express server listening on port ${PORT}`)
});

const Matchmaking = require('./matchmaking');

const serverSocket = socketIO(server);
Matchmaking.init(serverSocket);

serverSocket.sockets.on('connection', function(socket) {
  console.log('==>#connection# [User:' + socket.id + '] New player is connected');

  socket.on('enter-game',             data => Matchmaking.onEnterGame(socket, data));
  socket.on('host-start',             ()   => Matchmaking.onHostStart(socket));

  socket.on('player-position-update', data => Matchmaking.onPositionUpdate(socket, data));
  socket.on('player-bomb-create',     data => Matchmaking.onBombCreate(socket, data));
  socket.on('player-spoil-pick-up',   data => Matchmaking.onSpoilPickUp(socket, data));
  socket.on('player-dead',            data => Matchmaking.onPlayerDead(socket, data));

  socket.on('disconnect',             ()   => {
    console.log('==>#disconnect# [User:' + socket.id + '] Player is disconnected');
    Matchmaking.onDisconnect(socket);
  });
});
