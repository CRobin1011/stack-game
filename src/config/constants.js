// Box dimensions
export const BOX_DIMENSIONS = {
  HEIGHT: 0.8,
  GENESIS_HEIGHT: 2.5,
  ORIGINAL_SIZE: 3
};

// Timing configuration
export const TIMING = {
  OPTIMAL_CLICK_INTERVAL: 500, // ms - used in timing error calculation
  AUTOPILOT_SPEED_FACTOR: 0.3
};

// Gameplay mechanics
export const GAMEPLAY = {
  PERFECT_TOLERANCE: 7.5 // percentage threshold for perfect placement
};

// Movement boundaries
export const MOVE_BOUNDS = {
  min: -5,
  max: 6
};

export const BOX_HEIGHT = BOX_DIMENSIONS.HEIGHT;
export const GENESIS_BOX_HEIGHT = BOX_DIMENSIONS.GENESIS_HEIGHT;
export const ORIGINAL_BOX_SIZE = BOX_DIMENSIONS.ORIGINAL_SIZE;
export const OPTIMAL_CLICK_INTERVAL = TIMING.OPTIMAL_CLICK_INTERVAL;
export const AUTOPILOT_SPEED_FACTOR = TIMING.AUTOPILOT_SPEED_FACTOR;
export const PERFECT_TOLERANCE = GAMEPLAY.PERFECT_TOLERANCE;