// core/GameModes.js
import { GAME_MODES } from '../config/gameModesConfig.js';

export class GameModes {
  static CLASSIC = 'classic';
  static RUSH = 'rush';
  static FLASH = 'flash';

  constructor() {
    this.currentMode = GameModes.CLASSIC;
  }

  setMode(modeId) {
    if (GAME_MODES[modeId]) {
      this.currentMode = modeId;
      return true;
    }
    return false;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  getCurrentConfig() {
    return GAME_MODES[this.currentMode];
  }

  getSpeed(level = 0) {
    const config = this.getCurrentConfig();
    return config.baseSpeed + (config.speedIncrease * level);
  }

  getPerfectBonus() {
    return this.getCurrentConfig().perfectBonus;
  }

  getComboMultiplier() {
    return this.getCurrentConfig().comboMultiplier;
  }

  getAllModes() {
    return Object.values(GAME_MODES);
  }

  shouldShowSpeedWarning(level) {
    const mode = this.currentMode;

    switch (mode) {
      case GameModes.RUSH:
        return level > 10 && level % 5 === 0;
      case GameModes.FLASH:
        return level > 5 && level % 3 === 0;
      default:
        return false;
    }
  }

  getModeSpecificFeedback(score, combo) {
    switch (this.currentMode) {
      case GameModes.RUSH:
        if (combo >= 10) return '🔥 RUSH MASTER!';
        if (combo >= 5) return '⚡ Speed Demon!';
        break;
      case GameModes.FLASH:
        if (combo >= 15) return '⚡ LIGHTNING GOD!';
        if (combo >= 8) return '💫 Flash Elite!';
        if (combo >= 3) return '⭐ Quick Reflexes!';
        break;
      case GameModes.CLASSIC:
        if (combo >= 20) return '👑 LEGENDARY!';
        if (combo >= 10) return '🏆 Champion!';
        if (combo >= 5) return '⭐ Well Done!';
        break;
    }
    return null;
  }

  calculateModeScore(baseScore, perfectCount, combo) {
    const config = this.getCurrentConfig();
    let score = baseScore;

    score += perfectCount * config.perfectBonus;

    if (combo > 3) {
      const comboBonus = Math.floor(combo / 3) * config.comboMultiplier;
      score += comboBonus;
    }

    return Math.floor(score);
  }
}
