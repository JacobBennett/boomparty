const { Game } = require('./entity/game');

// In-memory room registry. Rooms (and their invite links) do not survive a
// server restart — stale links get 'room-not-found' and the client falls back
// to creating a fresh room.

const rooms = new Map(); // code -> room

// No 0/O/1/I/L: codes are meant to be read aloud and retyped.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
  } while (rooms.has(code));
  return code;
}

const Rooms = {
  createRoom: function() {
    let room = {
      code: generateCode(),
      game: new Game(),
      countdownTimer: null,
      countdownLeft: 0,
      roundTimer: null,
      bombTimers: new Map() // bomb.id -> fuse timer
    };
    rooms.set(room.code, room);
    return room;
  },

  getRoom: function(code) {
    return rooms.get(code) || null
  },

  clearRoomTimers: function(room) {
    if (room.countdownTimer) { clearInterval(room.countdownTimer); room.countdownTimer = null }
    if (room.roundTimer) { clearTimeout(room.roundTimer); room.roundTimer = null }
    for (let timer of room.bombTimers.values()) { clearTimeout(timer) }
    room.bombTimers.clear();
  },

  deleteRoom: function(room) {
    Rooms.clearRoomTimers(room);
    rooms.delete(room.code);
  },

  roomsCount: function() {
    return rooms.size
  }
}

module.exports = Rooms;
