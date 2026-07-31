const { POWER, BOMBS, INITIAL_POWER, INITIAL_BOMBS } = require('../constants');

class Player {

  constructor({ id, name, position, spawnOnGrid, profilePictureSmall }) {
    this.id          = id;
    this.name        = name;
    this.position    = position;
    this.spawnOnGrid = spawnOnGrid;

    this.profilePictureSmall = profilePictureSmall;

    this.isAlive = true;

    this.power       = INITIAL_POWER;
    this.totalBombs  = INITIAL_BOMBS;

    // Bombs currently ticking on the field; not part of the wire payload.
    this.activeBombs = 0;
  }

  pickSpoil(spoilType) {
    if (spoilType === POWER) {
      this.power += 1;
    }
    if (spoilType === BOMBS) {
      this.totalBombs += 1;
    }
  }

  canPlaceBomb() {
    return this.isAlive && this.activeBombs < this.totalBombs;
  }

  dead() {
    this.isAlive = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      isAlive: this.isAlive,
      power: this.power,
      totalBombs: this.totalBombs,
      profilePictureSmall: this.profilePictureSmall
    }
  }
}

exports.Player = Player;
