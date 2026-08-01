const {
  TILE_SIZE, EMPTY_CELL, DESTRUCTIBLE_CELL, NON_DESTRUCTIBLE_CELL, MAPS, DEFAULT_AVATAR
} = require('../constants');

var { Player } = require('./player');
var { Bomb } = require('./bomb.js');

var uuidv4 = require('uuid/v4');

// Game lifecycle: pending -> countdown -> running -> finished
class Game {

  constructor() {
    this.id       = uuidv4();
    this.map_name = MAPS[Math.floor(Math.random() * MAPS.length)];
    this.state    = 'pending';

    this.layer_info  = require('../../client/maps/' + this.map_name + '.json').layers[0]
    this.max_players = this.layer_info.properties.max_players

    // Set when the game starts running; lets clients render the countdown.
    this.round_ends_at = null

    // Lobby-only state: the first player to join hosts (decides when to start).
    this.hostId = null

    // NOTE: we can`t use new Map - because Socket.io do not support such format
    this.players = {}

    // NOTE: Copy objct - not reference
    this.playerSpawns = this.layer_info.properties.spawns.slice()

    this.shadow_map = this.createMapData();
    this.spoils     = new Map();
    this.bombs      = new Map();
    this.bombCells  = new Set();
  }

  addPlayer(id, name) {
    let spawnOnGrid = this.getAndRemoveSpawn()

    // Wire positions are sprite-center pixels.
    let position = {
      x: spawnOnGrid.col * TILE_SIZE + TILE_SIZE / 2,
      y: spawnOnGrid.row * TILE_SIZE + TILE_SIZE / 2
    }

    let player = new Player({
      id: id,
      name: name,
      position: position,
      spawnOnGrid: spawnOnGrid,
      profilePictureSmall: DEFAULT_AVATAR
    })
    this.players[player.id] = player

    return player
  }

  removePlayer(id) {
    let player = this.players[id];
    if (!player) { return }

    this.playerSpawns.push(player.spawnOnGrid)

    delete this.players[id];
  }

  playersCount() {
    return Object.keys(this.players).length
  }

  alivePlayers() {
    return Object.values(this.players).filter(player => player.isAlive)
  }

  isEmpty() {
    return this.playersCount() === 0
  }

  isFull() {
    return this.playersCount() >= this.max_players
  }

  getAndRemoveSpawn() {
    let index = Math.floor(Math.random() * this.playerSpawns.length);
    let spawnOnGrid = this.playerSpawns[index];
    this.playerSpawns.splice(index, 1);

    return spawnOnGrid;
  }

  createMapData() {
    let tiles  = this.layer_info.data
    let width  = this.layer_info.width
    let height = this.layer_info.height
    let wall   = this.layer_info.properties.wall
    let balk   = this.layer_info.properties.balk

    let mapMatrix = [];
    let i = 0;

    for(let row = 0; row < height; row++) {
      mapMatrix.push([]);

      for(let col = 0; col < width; col++) {
        mapMatrix[row][col] = EMPTY_CELL;

        if(tiles[i] == balk) {
          mapMatrix[row][col] = DESTRUCTIBLE_CELL;
        } else if(tiles[i] == wall) {
          mapMatrix[row][col] = NON_DESTRUCTIBLE_CELL;
        }

        i++;
      }
    }

    return mapMatrix;
  }

  addBomb({ ownerId, col, row, power }) {
    let cellKey = row + '_' + col;

    if ( this.bombCells.has(cellKey) ) { return false }
    if ( this.getMapCell(row, col) !== EMPTY_CELL ) { return false }

    let bomb = new Bomb({ game: this, ownerId: ownerId, col: col, row: row, power: power });
    this.bombs.set(bomb.id, bomb);
    this.bombCells.add(cellKey);
    return bomb
  }

  removeBomb(bomb) {
    this.bombs.delete(bomb.id);
    this.bombCells.delete(bomb.row + '_' + bomb.col);
  }

  getMapCell(row, col) {
    if (!this.shadow_map[row]) { return undefined }
    return this.shadow_map[row][col]
  }

  nullifyMapCell(row, col) {
    this.shadow_map[row][col] = EMPTY_CELL
  }

  findSpoil(spoil_id){
    return this.spoils.get(spoil_id)
  }

  findSpoilAt(row, col){
    for (let spoil of this.spoils.values()) {
      if (spoil.row === row && spoil.col === col) { return spoil }
    }
    return null
  }

  addSpoil(spoil) {
    this.spoils.set(spoil.id, spoil);
  }

  deleteSpoil(spoil_id){
    this.spoils.delete(spoil_id)
  }

  layerInfoPayload() {
    return {
      width: this.layer_info.width,
      height: this.layer_info.height,
      data: this.layer_info.data,
      properties: {
        wall: this.layer_info.properties.wall,
        balk: this.layer_info.properties.balk
      }
    }
  }

  payload({ forObserver = false } = {}) {
    let payload = {
      id: this.id,
      map_name: this.map_name,
      players: Object.values(this.players),
      spoils: [...this.spoils.values()],
      bombs: [...this.bombs.values()],
      layerInfo: this.layerInfoPayload(),
      roundRemainingMs: this.round_ends_at ? Math.max(0, this.round_ends_at - Date.now()) : null
    }

    if (forObserver) {
      payload.shadowMap = this.shadow_map
    }

    return payload
  }
}

exports.Game = Game;
