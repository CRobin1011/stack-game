/**
 * Game Modes System
 * Handles different game modes with varying speeds and mechanics
 */

export class GameModes {
    static CLASSIC = 'classic';
    static RUSH = 'rush';
    static FLASH = 'flash';

    constructor() {
        this.currentMode = GameModes.CLASSIC;
        this.modeConfigs = {
            [GameModes.CLASSIC]: {
                name: 'Classic',
                description: 'Traditional stack game with steady pace',
                baseSpeed: 0.008,
                speedIncrease: 0.0002,
                perfectBonus: 1,
                comboMultiplier: 1,
                backgroundColor: '#1a1a1a',
                accentColor: '#4CAF50'
            },
            [GameModes.RUSH]: {
                name: 'Rush',
                description: 'Fast-paced mode with increasing speed',
                baseSpeed: 0.012,
                speedIncrease: 0.0005,
                perfectBonus: 2,
                comboMultiplier: 1.5,
                backgroundColor: '#1a1a2e',
                accentColor: '#FF6B6B'
            },
            [GameModes.FLASH]: {
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
    }

    setMode(mode) {
        if (this.modeConfigs[mode]) {
            this.currentMode = mode;
            this.applyModeStyles();
            return true;
        }
        return false;
    }

    getCurrentMode() {
        return this.currentMode;
    }

    getCurrentConfig() {
        return this.modeConfigs[this.currentMode];
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

    applyModeStyles() {
        const config = this.getCurrentConfig();
        document.documentElement.style.setProperty('--mode-bg-color', config.backgroundColor);
        document.documentElement.style.setProperty('--mode-accent-color', config.accentColor);
        
        // Add mode class to body
        document.body.className = document.body.className.replace(/mode-\w+/g, '');
        document.body.classList.add(`mode-${this.currentMode}`);
    }

    getAllModes() {
        return Object.keys(this.modeConfigs).map(key => ({
            id: key,
            ...this.modeConfigs[key]
        }));
    }

    // Special mode effects
    shouldShowSpeedWarning(level) {
        const config = this.getCurrentConfig();
        const currentSpeed = this.getSpeed(level);
        
        switch (this.currentMode) {
            case GameModes.RUSH:
                return level > 10 && level % 5 === 0;
            case GameModes.FLASH:
                return level > 5 && level % 3 === 0;
            default:
                return false;
        }
    }

    getModeSpecificFeedback(score, combo) {
        const config = this.getCurrentConfig();
        
        switch (this.currentMode) {
            case GameModes.RUSH:
                if (combo >= 10) return "🔥 RUSH MASTER!";
                if (combo >= 5) return "⚡ Speed Demon!";
                break;
            case GameModes.FLASH:
                if (combo >= 15) return "⚡ LIGHTNING GOD!";
                if (combo >= 8) return "💫 Flash Elite!";
                if (combo >= 3) return "⭐ Quick Reflexes!";
                break;
            case GameModes.CLASSIC:
                if (combo >= 20) return "👑 LEGENDARY!";
                if (combo >= 10) return "🏆 Champion!";
                if (combo >= 5) return "⭐ Well Done!";
                break;
        }
        return null;
    }

    // Calculate mode-specific scoring
    calculateModeScore(baseScore, perfectCount, combo) {
        const config = this.getCurrentConfig();
        let score = baseScore;
        
        // Add perfect bonus
        score += perfectCount * config.perfectBonus;
        
        // Add combo multiplier
        if (combo > 3) {
            const comboBonus = Math.floor(combo / 3) * config.comboMultiplier;
            score += comboBonus;
        }
        
        return Math.floor(score);
    }
}