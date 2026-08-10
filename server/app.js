const express = require('express');
const socketIO = require('socket.io');
const favicon = require('serve-favicon');

const app = express();
const server = require('http').createServer(app);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Media is immutable-in-practice (new art gets a new filename), so let
// browsers — and any CDN in front — cache it for a month. Code (html/js/css)
// has no hashed filenames and changes every deploy, so it must revalidate
// (ETag 304s keep that cheap).
const MEDIA_DIRS = ['images', 'sound', 'video', 'maps'];

app.use(express.static(path.join(__dirname, '..', 'client'), {
  setHeaders: (res, filePath) => {
    let relative = path.relative(path.join(__dirname, '..', 'client'), filePath);
    if (MEDIA_DIRS.includes(relative.split(path.sep)[0])) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use(favicon(path.join(__dirname, '..', 'client', 'favicon.ico')));

// Serve runtime libraries straight from node_modules. Only changes on a
// dependency bump, so a day of caching is safe.
const nm_dependencies = ['phaser'];
nm_dependencies.forEach(dep => {
  app.use(`/${dep}`, express.static(path.join(__dirname, '..', 'node_modules', dep), { maxAge: '1d' }));
});

server.listen(PORT, function(){
  console.log(`Express server listening on port ${PORT}`)
});

const Matchmaking = require('./matchmaking');

const serverSocket = socketIO(server);
Matchmaking.init(serverSocket);

serverSocket.sockets.on('connection', function(socket) {
  console.log('==>#connection# [User:' + socket.id + '] New player is connected');

  socket.on('create-room',            data => Matchmaking.onCreateRoom(socket, data));
  socket.on('join-room',              data => Matchmaking.onJoinRoom(socket, data));
  socket.on('host-start',             data => Matchmaking.onHostStart(socket, data));

  socket.on('player-position-update', data => Matchmaking.onPositionUpdate(socket, data));
  socket.on('player-bomb-create',     data => Matchmaking.onBombCreate(socket, data));
  socket.on('player-spoil-pick-up',   data => Matchmaking.onSpoilPickUp(socket, data));
  socket.on('player-dead',            data => Matchmaking.onPlayerDead(socket, data));

  socket.on('disconnect',             ()   => {
    console.log('==>#disconnect# [User:' + socket.id + '] Player is disconnected');
    Matchmaking.onDisconnect(socket);
  });
});
