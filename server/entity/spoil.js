const { SPEED, POWER, BOMBS } = require('../constants');

var uuidv4 = require('uuid/v4');

class Spoil {

  constructor(row, col) {
    this.id = uuidv4();

    this.row = row;
    this.col = col;

    this.spoilType = [SPEED, POWER, BOMBS][Math.floor(Math.random() * 3)];
  }
}

exports.Spoil = Spoil;
