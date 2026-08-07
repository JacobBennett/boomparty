const TILE_SIZE = 32;

const EXPLOSION_TIME = 2000;

const SPOIL_CHANCE = 50;
const SPEED = 0;
const POWER = 1;
const BOMBS = 2;

const EMPTY_CELL = 0;
const NON_DESTRUCTIBLE_CELL = 1;
const DESTRUCTIBLE_CELL = 2;

const INITIAL_POWER = 1;
const INITIAL_BOMBS = 1;

const COUNTDOWN_SECONDS = 3;
const WIN_DELAY_MS = 3000;

// Host-configurable match settings (validated server-side).
const ROUNDS_MIN = 1;
const ROUNDS_MAX = 5;
const DEFAULT_ROUNDS = 3;
const ROUND_TIME_MIN_S = 60;
const ROUND_TIME_MAX_S = 300;
const DEFAULT_ROUND_TIME_S = 180;
const INTERMISSION_SECONDS = 10;

// Pinned to cold_map for now; add 'hot_map' back to restore random selection.
const MAPS = ['cold_map'];

const DEFAULT_AVATAR = '/images/game/avatar64.png';

module.exports = {
  TILE_SIZE,
  EXPLOSION_TIME,
  SPOIL_CHANCE,
  SPEED,
  POWER,
  BOMBS,
  EMPTY_CELL,
  DESTRUCTIBLE_CELL,
  NON_DESTRUCTIBLE_CELL,
  INITIAL_POWER,
  INITIAL_BOMBS,
  COUNTDOWN_SECONDS,
  WIN_DELAY_MS,
  ROUNDS_MIN,
  ROUNDS_MAX,
  DEFAULT_ROUNDS,
  ROUND_TIME_MIN_S,
  ROUND_TIME_MAX_S,
  DEFAULT_ROUND_TIME_S,
  INTERMISSION_SECONDS,
  MAPS,
  DEFAULT_AVATAR
}
