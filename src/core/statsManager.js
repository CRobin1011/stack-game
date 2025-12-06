/**
 * Stats Management System
 * Handles persistent statistics tracking and calculation
 */

export class StatsManager {
    constructor() {
        this.stats = this.loadStats();
        this.currentGameStats = this.initializeGameStats();
    }

    loadStats() {
        const saved = localStorage.getItem('stackGameStats');
        if (saved) {
            const loadedStats = JSON.parse(saved);
            // Ensure all required properties exist for backward compatibility
            return {
                gamesStarted: loadedStats.gamesStarted || 0,
                gamesEnded: loadedStats.gamesEnded || 0,
                totalScore: loadedStats.totalScore || 0,
                highScore: loadedStats.highScore || 0,
                beatenHighScore: loadedStats.beatenHighScore || 0,
                longestCombo: loadedStats.longestCombo || 0,
                perfects: loadedStats.perfects || 0,
                cutTiles: loadedStats.cutTiles || 0,
                totalErrorPercentage: loadedStats.totalErrorPercentage || 0,
                bestErrorPercentage: loadedStats.bestErrorPercentage || 100,
                bestPerfectPercentage: loadedStats.bestPerfectPercentage || 0,
                totalGames: loadedStats.totalGames || 0,
                totalPlayTime: loadedStats.totalPlayTime || 0,
                focusIndexHistory: loadedStats.focusIndexHistory || [],
                bestFocusIndex: loadedStats.bestFocusIndex || 0,
                longestPerfectCombo: loadedStats.longestPerfectCombo || 0,
                totalPerfectsCombo: loadedStats.totalPerfectsCombo || 0,
            };
        }
        
        return {
            gamesStarted: 0,
            gamesEnded: 0,
            totalScore: 0,
            highScore: 0,
            beatenHighScore: 0,
            longestCombo: 0,
            perfects: 0,
            longestPerfectCombo: 0,
            totalPerfectsCombo: 0,
            cutTiles: 0,
            totalErrorPercentage: 0,
            bestErrorPercentage: 100,
            bestPerfectPercentage: 0,
            totalGames: 0,
            totalPlayTime: 0,
            focusIndexHistory: [],
            bestFocusIndex: 0
        };
    }

    saveStats() {
        localStorage.setItem('stackGameStats', JSON.stringify(this.stats));
    }

    initializeGameStats() {
        return {
            score: 0,
            combo: 0,
            longestCombo:0,
            perfects: 0,
            perfectCombo: 0,
            longestPerfectCombo: 0,
            errors: [],
            timingErrors: [],
            alignmentOffsets: [],
            startTime: Date.now(),
            endTime: null,
            clickTimes: [],
            focusIndex: 0
        };
    }

    startGame() {
        this.stats.gamesStarted++;
        this.currentGameStats = this.initializeGameStats();
        this.currentGameStats.startTime = Date.now();
        this.saveStats();
    }

    endGame() {
        this.stats.gamesEnded++;
        this.currentGameStats.endTime = Date.now();
        
        // Update total score
        this.stats.totalScore += this.currentGameStats.score;
        
        // Check high score
        if (this.currentGameStats.score > this.stats.highScore) {
            this.stats.beatenHighScore++;
            this.stats.highScore = this.currentGameStats.score;
        }
        
        // longest combo biasa di game ini
        const gameLongestCombo = this.currentGameStats.longestCombo || this.currentGameStats.combo || 0;
        if (gameLongestCombo > this.stats.longestCombo) {
            this.stats.longestCombo = gameLongestCombo;
        }

        // longest perfect combo di game ini
        const gameLongestPerfectCombo = this.currentGameStats.longestPerfectCombo || 0;
        if (gameLongestPerfectCombo > (this.stats.longestPerfectCombo || 0)) {
            this.stats.longestPerfectCombo = gameLongestPerfectCombo;
        }

        // optional: total akumulasi perfect combos
        this.stats.totalPerfectsCombo = (this.stats.totalPerfectsCombo || 0) + gameLongestPerfectCombo;

        // Update perfects
        this.stats.perfects += this.currentGameStats.perfects;
        this.stats.cutTiles += this.currentGameStats.score;
        
        // Calculate error percentage for this game
        const gameErrorPercentage = this.calculateCurrentGameErrorPercentage();
        this.stats.totalErrorPercentage += gameErrorPercentage;
        
        if (gameErrorPercentage < this.stats.bestErrorPercentage && gameErrorPercentage > 0) {
            this.stats.bestErrorPercentage = gameErrorPercentage;
        }
        
        // Calculate perfect percentage
        const perfectPercentage = this.calculateCurrentGamePerfectPercentage();
        if (perfectPercentage > this.stats.bestPerfectPercentage) {
            this.stats.bestPerfectPercentage = perfectPercentage;
        }
        
        // Calculate focus index
        this.currentGameStats.focusIndex = this.calculateFocusIndex();
        
        // Ensure focusIndexHistory array exists
        if (!this.stats.focusIndexHistory) {
            this.stats.focusIndexHistory = [];
        }
        
        this.stats.focusIndexHistory.push(this.currentGameStats.focusIndex);
        
        if (this.currentGameStats.focusIndex > this.stats.bestFocusIndex) {
            this.stats.bestFocusIndex = this.currentGameStats.focusIndex;
        }
        
        // Update play time
        this.stats.totalPlayTime += (this.currentGameStats.endTime - this.currentGameStats.startTime);
        this.stats.totalGames++;
        
        this.saveStats();
    }

    addScore() {
        this.currentGameStats.score++;
        this.currentGameStats.combo++;
        
        if(this.currentGameStats.combo > (this.currentGameStats.longestCombo || 0)){
            this.currentGameStats.longestCombo = this.currentGameStats.combo;
        }

        // Ensure clickTimes array exists
        if (!this.currentGameStats.clickTimes) this.currentGameStats.clickTimes = [];
        this.currentGameStats.clickTimes.push(Date.now());
    }

    addPerfect() {
        this.currentGameStats.perfects++;

        if(this.currentGameStats.perfectCombo == null){
            this.currentGameStats.perfectCombo = 0;
        }
        this.currentGameStats.perfectCombo++;

        if(this.currentGameStats.perfectCombo > (this.currentGameStats.longestPerfectCombo || 0)){
            this.currentGameStats.longestPerfectCombo = this.currentGameStats.perfectCombo
        }
    }

    addError(errorPercentage, timingError, alignmentOffset) {
        // Ensure arrays exist
        if (!this.currentGameStats.errors) this.currentGameStats.errors = [];
        if (!this.currentGameStats.timingErrors) this.currentGameStats.timingErrors = [];
        if (!this.currentGameStats.alignmentOffsets) this.currentGameStats.alignmentOffsets = [];
        
        this.currentGameStats.errors.push(errorPercentage);
        this.currentGameStats.timingErrors.push(timingError);
        this.currentGameStats.alignmentOffsets.push(alignmentOffset);
    }

    resetCombo() {
        this.currentGameStats.combo = 0;
    }

    resetPerfectCombo() {
        this.currentGameStats.perfectCombo = 0;
    }


    calculateCurrentGameErrorPercentage() {
        if (!this.currentGameStats.errors || this.currentGameStats.errors.length === 0) return 0;
        const sum = this.currentGameStats.errors.reduce((a, b) => a + b, 0);
        return sum / this.currentGameStats.errors.length;
    }

    calculateCurrentGamePerfectPercentage() {
        if (this.currentGameStats.score === 0) return 0;
        return (this.currentGameStats.perfects / this.currentGameStats.score) * 100;
    }

    calculateAverageErrorPercentage() {
        if (this.stats.totalGames === 0) return 0;
        return this.stats.totalErrorPercentage / this.stats.totalGames;
    }

    calculateCPM() {
        const gameTime = (this.currentGameStats.endTime - this.currentGameStats.startTime) / 1000 / 60; // minutes
        if (gameTime === 0) return 0;
        return this.currentGameStats.score / gameTime;
    }

    // Focus Index calculation based on research of average human performance metrics
    calculateFocusIndex() {
        const score = this.currentGameStats.score;
        const perfectPercentage = this.calculateCurrentGamePerfectPercentage();
        const errorPercentage = this.calculateCurrentGameErrorPercentage();
        const cpm = this.calculateCPM();
        const combo = this.currentGameStats.longestCombo || this.currentGameStats.combo;
        
        // Baseline thresholds based on average human performance
        const avgScore = 10; // Average score for casual players
        const avgPerfectPercentage = 20; // Average perfect percentage
        const avgErrorPercentage = 30; // Average error percentage
        const avgCPM = 15; // Average clicks per minute
        const avgCombo = 5; // Average longest combo
        
        // Calculate normalized scores (0-1)
        const scoreNorm = Math.min(score / (avgScore * 2), 1);
        const perfectNorm = Math.min(perfectPercentage / (avgPerfectPercentage * 2), 1);
        const errorNorm = Math.max(0, 1 - (errorPercentage / avgErrorPercentage));
        const cpmNorm = Math.min(cpm / (avgCPM * 2), 1);
        const comboNorm = Math.min(combo / (avgCombo * 2), 1);
        
        // Weighted calculation
        const focusIndex = (
            scoreNorm * 0.3 +          // 30% weight on score
            perfectNorm * 0.25 +       // 25% weight on precision
            errorNorm * 0.25 +         // 25% weight on consistency (inverse error)
            cpmNorm * 0.1 +            // 10% weight on speed
            comboNorm * 0.1            // 10% weight on streak
        ) * 100;
        
        return Math.round(Math.min(100, Math.max(0, focusIndex)));
    }

    getGameSummary() {
        const gameLongestCombo = this.currentGameStats.longestCombo || this.currentGameStats.combo || 0;

        const currentStreak = this.currentGameStats.combo || 0;
        const currentLongestStreak = this.currentGameStats.longestCombo | 0;

        const currentPerfectCombo = this.currentGameStats.perfectCombo || 0;
        const longestPerfectCombo = this.currentGameStats.longestPerfectCombo || 0;

        const isComboRecord = gameLongestCombo > this.stats.longestCombo;
        const isPerfectComboRecord = longestPerfectCombo > (this.stats.longestPerfectCombo || 0);

        const perfectPercentage = this.calculateCurrentGamePerfectPercentage();
        const errorPercentage = this.calculateCurrentGameErrorPercentage();
        const cpm = this.calculateCPM();
        const focusIndex = this.currentGameStats.focusIndex || this.calculateFocusIndex();

        const timingErrors = this.currentGameStats.timingErrors || [];
        const alignmentOffsets = this.currentGameStats.alignmentOffsets || [];

        return {
            longestCombo: {
                current: gameLongestCombo,
                isRecord: isComboRecord,
                previous: this.stats.longestCombo,
            },
            perfectCombo: {
                current: currentPerfectCombo,
                longest: longestPerfectCombo,
                bestAllTime: this.stats.longestPerfectCombo || 0,
                isRecord: isPerfectComboRecord,
            },
            perfectPercentage: {
                current: perfectPercentage,
                best: this.stats.bestPerfectPercentage,
            },
            errorPercentage: {
                current: errorPercentage,
                best: this.stats.bestErrorPercentage,
            },
            totalGames: this.stats.totalGames + 1,
            cpm,
            focusIndex,
            timingErrorAvg:
                timingErrors.length > 0
                    ? timingErrors.reduce((a, b) => a + b, 0) / timingErrors.length
                    : 0,
            alignmentOffsetAvg:
                alignmentOffsets.length > 0
                    ? alignmentOffsets.reduce((a, b) => a + b, 0) /
                    alignmentOffsets.length
                    : 0,
            streak: currentStreak,
        };
    }

    getAllTimeStats() {
        // Ensure focusIndexHistory exists
        const focusHistory = this.stats.focusIndexHistory || [];
        
        return {
            gamesPlayed: this.stats.totalGames,
            highScore: this.stats.highScore,
            totalScore: this.stats.totalScore,
            averageScore: this.stats.totalGames > 0 ? this.stats.totalScore / this.stats.totalGames : 0,
            longestCombo: this.stats.longestCombo,
            totalPerfects: this.stats.perfects,
            averageErrorPercentage: this.calculateAverageErrorPercentage(),
            bestErrorPercentage: this.stats.bestErrorPercentage,
            bestPerfectPercentage: this.stats.bestPerfectPercentage,
            totalPlayTime: this.stats.totalPlayTime,
            averageFocusIndex: focusHistory.length > 0 
                ? focusHistory.reduce((a, b) => a + b, 0) / focusHistory.length 
                : 0,
            bestFocusIndex: this.stats.bestFocusIndex
        };
    }
}