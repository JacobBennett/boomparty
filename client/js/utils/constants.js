export const TILESET = 'tiles';

export const TILE_SIZE = 32;
export const GAME_WIDTH = 896;
export const GAME_HEIGHT = 576;

export const EXPLOSION_TIME = 2000;
export const PING = 100;

// Spoil types (server-defined)
export const SPEED = 0;
export const POWER = 1;
export const BOMBS = 2;

// speed = INITIAL_SPEED + STEP_SPEED * (speedLevel - 1)
export const INITIAL_SPEED = 150;
export const STEP_SPEED = 15;

export const INITIAL_POWER = 1;
export const INITIAL_BOMBS = 1;

export const BOMB_COOLDOWN = 150;

// Shadow-map cell codes (server-defined)
export const EMPTY_CELL = 0;
export const NON_DESTRUCTIBLE_CELL = 1;
export const DESTRUCTIBLE_CELL = 2;

// Tileset frames
export const WALL_FRAME = 0;
export const BALK_FRAME = 1;
export const FLOOR_FRAME = 2;
