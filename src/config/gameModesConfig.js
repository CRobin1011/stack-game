// config/gameModesConfig.js

export const GAME_MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional stack game with steady pace',
    baseSpeed: 0.0075,
    speedIncrease: 0.0001,
    perfectBonus: 1,
    comboMultiplier: 1,
    backgroundColor: '#1a1a1a',
    accentColor: '#4CAF50'
  },
  rush: {
    id: 'rush',
    name: 'Rush',
    description: 'Fast-paced mode with increasing speed',
    baseSpeed: 0.012,
    speedIncrease: 0.0005,
    perfectBonus: 2,
    comboMultiplier: 1.5,
    backgroundColor: '#1a1a2e',
    accentColor: '#FF6B6B'
  },
  flash: {
    id: 'flash',
    name: 'Flash',
    description: 'Lightning fast mode for experts',
    baseSpeed: 0.020,
    speedIncrease: 0.001,
    perfectBonus: 3,
    comboMultiplier: 2,
    backgroundColor: '#2d1b69',
    accentColor: '#FFD93D'
  }
};
