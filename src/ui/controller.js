export class UIController {
    constructor({ stats, gameModes, feedback, review }) {
        this.stats = stats;
        this.gameModes = gameModes;
        this.feedback = feedback;
        this.review = review;

        // DOM refs
        this.scoreElement = document.getElementById('score');
        this.instructionsElement = document.getElementById('instructions');
        this.resultsElement = document.getElementById('results');
        this.gameHudElement = document.getElementById('game-hud');
        this.currentModeElement = document.getElementById('current-mode');
        this.currentComboElement = document.getElementById('current-combo');
        this.currentFocusElement = document.getElementById('current-focus');

        this.modeSelector = document.getElementById('mode-selector');
        this.selectModeBtn = document.getElementById('select-mode-btn');
        this.quickStartBtn = document.getElementById('quick-start-btn');
        this.startSelectedModeBtn = document.getElementById('start-selected-mode');

        this.finalScoreElement = document.getElementById('final-score-value');
        this.quickComboElement = document.getElementById('quick-combo');
        this.quickFocusElement = document.getElementById('quick-focus');
        this.viewReviewBtn = document.getElementById('view-review-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');

        this.statsPanel = document.getElementById('stats-panel');
        this.menuBtn = document.getElementById('menu-btn');

        this.selectedMode = this.gameModes.constructor.CLASSIC || 'classic';
    }

    init(engine) {
        this.engine = engine;

        this._setupModeButtons();
        this._setupResultsButtons();
        this._setupStatsPanel();
        this._setupGlobalListeners();
        this._initModeSelectorUI();

        this.applyModeStyles(this.gameModes.getCurrentConfig());
    }

    _setupModeButtons() {
        if (this.selectModeBtn) {
            this.selectModeBtn.addEventListener('click', e => {
                e.stopPropagation();
                this.showModeSelector();
            });
        }

        if (this.quickStartBtn) {
            this.quickStartBtn.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                this.selectedMode = 'classic';
                this.engine.startGame(this.selectedMode);
                this.hideInstructionsAndResults();
                this.showHud();
            });
        }

        if (this.startSelectedModeBtn) {
            this.startSelectedModeBtn.addEventListener('click', e => {
                e.stopPropagation();
                this.hideModeSelector();
                this.engine.startGame(this.selectedMode);
                this.hideInstructionsAndResults();
                this.showHud();
            });
        }

        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedMode = card.dataset.mode;
            });
        });
    }

    _setupResultsButtons() {
        if (this.viewReviewBtn) {
            this.viewReviewBtn.addEventListener('click', () => {
                this.engine.showReview();
                if (this.resultsElement) this.resultsElement.style.display = 'none';
            });
        }

        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => {
                this.engine.startGame(this.gameModes.getCurrentMode());
                this.hideResults();
                this.showHud();
            });
        }

        this.review.setOnPlayAgain(() => {
            this.engine.startGame(this.gameModes.getCurrentMode());
            this.showHud();
        });

        this.review.setOnViewStats(() => {
            this.showStatsPanel();
        });
    }

    _setupStatsPanel() {
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.showStatsPanel());
        }

        const statsCloseBtn = document.querySelector('.stats-close');
        const statsBackdrop = document.querySelector('.stats-backdrop');
        const closeStatsBtn = document.getElementById('close-stats-btn');

        if (statsCloseBtn) statsCloseBtn.addEventListener('click', () => this.hideStatsPanel());
        if (statsBackdrop) statsBackdrop.addEventListener('click', () => this.hideStatsPanel());
        if (closeStatsBtn) {
            closeStatsBtn.addEventListener('click', () => {
                // Hide stats panel first
                this.hideStatsPanel()

                this.hideResults()
                this.hideHud()

                // Hide all game UI elements

                if (this.scoreElement) {
                    this.scoreElement.textContent = '0'
                }

                // Show instructions screen (beginning page) - this is the mode selection screen
                if (this.instructionsElement) {
                    this.instructionsElement.style.display = 'flex'
                }

                this.feedback.clearAllPopups()

                console.log('Returned to beginning page (mode selection)')
            })
        }
        const resetStatsBtn = document.getElementById('reset-stats-btn');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                    localStorage.removeItem('stackGameStats');
                    this.stats.stats = this.stats.loadStats();
                    this.updateStatsPanel();
                    this.feedback.showPopup('📊 Statistics reset!', 'milestone', 2000);
                }
            });
        }
    }

    _setupGlobalListeners() {
        // placeholder if needed later
    }

    _initModeSelectorUI() {
        const modeBackdrop = document.querySelector('.mode-backdrop');
        if (modeBackdrop) {
            modeBackdrop.addEventListener('click', () => this.hideModeSelector());
        }

        const classicCard = document.querySelector('.mode-card[data-mode="classic"]');
        if (classicCard) {
            classicCard.classList.add('selected');
        }
    }

    hideInstructionsAndResults() {
        if (this.instructionsElement) this.instructionsElement.style.display = 'none';
        if (this.resultsElement) this.resultsElement.style.display = 'none';
    }

    showHud() {
        if (this.gameHudElement) this.gameHudElement.style.display = 'flex';
    }

    hideHud() {
        if (this.gameHudElement) this.gameHudElement.style.display = 'none';
    }

    showResults(gameStats, score) {
        if (this.finalScoreElement) this.finalScoreElement.textContent = score;
        if (this.quickComboElement) this.quickComboElement.textContent = gameStats.longestCombo.current;
        if (this.quickFocusElement) this.quickFocusElement.textContent = gameStats.focusIndex;

        if (this.resultsElement) this.resultsElement.style.display = 'flex';
        this.hideHud();
    }

    hideResults() {
        if (this.resultsElement) this.resultsElement.style.display = 'none';
    }

    showModeSelector() {
        if (!this.modeSelector) return;
        this.modeSelector.classList.remove('hidden');
        if (this.instructionsElement) this.instructionsElement.style.display = 'none';
        requestAnimationFrame(() => {
            this.modeSelector.classList.add('show');
        });
    }

    hideModeSelector() {
        if (!this.modeSelector) return;
        this.modeSelector.classList.remove('show');
        setTimeout(() => {
            this.modeSelector.classList.add('hidden');
        }, 300);
    }

    requestModeSelectionIfAllowed(eventTarget) {
        // ignore clicks on UI elements
        if (!eventTarget) {
            this.showModeSelector();
            return;
        }

        if (
            eventTarget.tagName === 'BUTTON' ||
            eventTarget.closest('button') ||
            eventTarget.closest('.mode-selector') ||
            eventTarget.closest('.stats-panel') ||
            eventTarget.closest('#instructions') ||
            eventTarget.closest('#results')
        ) {
            return;
        }

        this.showModeSelector();
    }

    updateScore(score) {
        if (this.scoreElement) this.scoreElement.textContent = score;
    }

    updateHUD(stats, modeConfig, gameEnded) {
        if (this.currentModeElement) {
            this.currentModeElement.textContent = modeConfig.name;
        }

        if (this.currentComboElement) {
            this.currentComboElement.textContent = stats.currentGameStats.combo;
        }

        if (this.currentFocusElement && !gameEnded) {
            const realTimeFocus = Math.max(0, Math.min(100,
                stats.calculateFocusIndex() + Math.random() * 10 - 5
            ));
            this.currentFocusElement.textContent = Math.round(realTimeFocus);
        }
    }

    updateStatsPanel() {
        const allTimeStats = this.stats.getAllTimeStats();

        document.getElementById('total-games').textContent = allTimeStats.gamesPlayed;
        document.getElementById('high-score').textContent = allTimeStats.highScore;
        document.getElementById('avg-focus').textContent = Math.round(allTimeStats.averageFocusIndex);
        document.getElementById('accuracy').textContent =
            Math.round((1 - allTimeStats.averageErrorPercentage / 100) * 100) + '%';

        document.getElementById('total-score').textContent = allTimeStats.totalScore;
        document.getElementById('longest-combo').textContent = allTimeStats.longestCombo;
        document.getElementById('total-perfects').textContent = allTimeStats.totalPerfects;
        document.getElementById('best-error').textContent = Math.round(allTimeStats.bestErrorPercentage) + '%';
        document.getElementById('play-time').textContent = Math.round(allTimeStats.totalPlayTime / 60000) + 'm';
        document.getElementById('best-focus-index').textContent = allTimeStats.bestFocusIndex;
    }

    showStatsPanel() {
        this.updateStatsPanel();
        if (!this.statsPanel) return;
        this.statsPanel.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.statsPanel.classList.add('show');
        });
    }

    hideStatsPanel() {
        if (!this.statsPanel) return;
        this.statsPanel.classList.remove('show');
        setTimeout(() => {
            this.statsPanel.classList.add('hidden');
        }, 300);
    }

    applyModeStyles(config) {
        document.documentElement.style.setProperty('--mode-bg-color', config.backgroundColor);
        document.documentElement.style.setProperty('--mode-accent-color', config.accentColor);

        document.body.className = document.body.className.replace(/mode-\w+/g, '');
        document.body.classList.add(`mode-${config.id}`);
    }
}
