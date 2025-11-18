/**
 * Review System
 * Displays comprehensive game review with stats and metrics
 */

export class ReviewSystem {
    constructor() {
        this.reviewModal = null;
        this.createReviewModal();
    }

    createReviewModal() {
        const modal = document.createElement('div');
        modal.id = 'review-modal';
        modal.className = 'review-modal hidden';
        modal.innerHTML = `
            <div class="review-backdrop"></div>
            <div class="review-content">
                <div class="review-header">
                    <h2>Game Review</h2>
                    <button class="review-close">×</button>
                </div>
                <div class="review-body">
                    <div class="review-section focus-index">
                        <h3>Focus Index</h3>
                        <div class="focus-circle">
                            <div class="focus-progress"></div>
                            <span class="focus-value">0</span>
                        </div>
                        <p class="focus-description"></p>
                    </div>
                    
                    <div class="review-section stats-grid">
                        <div class="stat-card">
                            <h4>Performance</h4>
                            <div class="stat-item">
                                <span class="stat-label">Score</span>
                                <span class="stat-value" id="review-score">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Longest Combo</span>
                                <span class="stat-value" id="review-combo">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Perfect %</span>
                                <span class="stat-value" id="review-perfect">0%</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <h4>Focus Metrics</h4>
                            <div class="stat-item">
                                <span class="stat-label">Timing Error</span>
                                <span class="stat-value" id="review-timing">0ms</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Alignment Offset</span>
                                <span class="stat-value" id="review-alignment">0%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">CPM</span>
                                <span class="stat-value" id="review-cpm">0</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <h4>All Time Best</h4>
                            <div class="stat-item">
                                <span class="stat-label">High Score</span>
                                <span class="stat-value" id="review-high-score">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Best Focus</span>
                                <span class="stat-value" id="review-best-focus">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Games Played</span>
                                <span class="stat-value" id="review-games">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-section recommendations">
                        <h3>Recommendations</h3>
                        <div class="recommendation-list" id="recommendations">
                        </div>
                    </div>
                </div>
                <div class="review-footer">
                    <button class="btn btn-primary" id="play-again">Play Again</button>
                    <button class="btn btn-secondary" id="view-stats">View All Stats</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.reviewModal = modal;
        
        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = this.reviewModal.querySelector('.review-close');
        const backdrop = this.reviewModal.querySelector('.review-backdrop');
        const playAgainBtn = this.reviewModal.querySelector('#play-again');
        const viewStatsBtn = this.reviewModal.querySelector('#view-stats');
        
        closeBtn.addEventListener('click', () => this.hide());
        backdrop.addEventListener('click', () => this.hide());
        
        playAgainBtn.addEventListener('click', () => {
            this.hide();
            this.onPlayAgain?.();
        });
        
        viewStatsBtn.addEventListener('click', () => {
            this.hide();
            this.onViewStats?.();
        });
    }

    show(gameStats, allTimeStats) {
        this.updateContent(gameStats, allTimeStats);
        this.reviewModal.classList.remove('hidden');
        
        // Animate in
        requestAnimationFrame(() => {
            this.reviewModal.classList.add('show');
            this.animateFocusCircle(gameStats.focusIndex);
        });
    }

    hide() {
        this.reviewModal.classList.remove('show');
        setTimeout(() => {
            this.reviewModal.classList.add('hidden');
        }, 300);
    }

    updateContent(gameStats, allTimeStats) {
        // Update focus index
        const focusValue = this.reviewModal.querySelector('.focus-value');
        const focusDescription = this.reviewModal.querySelector('.focus-description');
        
        focusValue.textContent = gameStats.focusIndex;
        focusDescription.textContent = this.getFocusDescription(gameStats.focusIndex);
        
        // Update stats
        document.getElementById('review-score').textContent = gameStats.longestCombo.current;
        document.getElementById('review-combo').textContent = gameStats.longestCombo.current + 
            (gameStats.longestCombo.isRecord ? ' 🏆 NEW RECORD!' : '');
        document.getElementById('review-perfect').textContent = Math.round(gameStats.perfectPercentage.current) + '%';
        
        document.getElementById('review-timing').textContent = Math.round(gameStats.timingErrorAvg) + 'ms';
        document.getElementById('review-alignment').textContent = Math.round(gameStats.alignmentOffsetAvg) + '%';
        document.getElementById('review-cpm').textContent = Math.round(gameStats.cpm);
        
        document.getElementById('review-high-score').textContent = allTimeStats.highScore;
        document.getElementById('review-best-focus').textContent = allTimeStats.bestFocusIndex;
        document.getElementById('review-games').textContent = allTimeStats.gamesPlayed;
        
        // Update recommendations
        this.updateRecommendations(gameStats, allTimeStats);
    }

    animateFocusCircle(focusIndex) {
        const circle = this.reviewModal.querySelector('.focus-progress');
        const circumference = 2 * Math.PI * 45; // radius = 45
        
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        
        const offset = circumference - (focusIndex / 100) * circumference;
        
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 100);
    }

    getFocusDescription(focusIndex) {
        if (focusIndex >= 90) return "🧠 Exceptional focus! You're in the zone!";
        if (focusIndex >= 75) return "🎯 Excellent concentration level!";
        if (focusIndex >= 60) return "👁️ Good focus, room for improvement!";
        if (focusIndex >= 40) return "💭 Average focus, practice more!";
        if (focusIndex >= 20) return "😅 Need to work on concentration!";
        return "🤔 Focus needs significant improvement!";
    }

    updateRecommendations(gameStats, allTimeStats) {
        const container = document.getElementById('recommendations');
        const recommendations = this.generateRecommendations(gameStats, allTimeStats);
        
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <span class="recommendation-icon">${rec.icon}</span>
                <span class="recommendation-text">${rec.text}</span>
            </div>
        `).join('');
    }

    generateRecommendations(gameStats, allTimeStats) {
        const recommendations = [];
        const { focusIndex, perfectPercentage, errorPercentage, cpm, timingErrorAvg } = gameStats;
        
        // Focus-based recommendations
        if (focusIndex < 50) {
            recommendations.push({
                icon: "🧘",
                text: "Try taking breaks between games to maintain focus"
            });
        }
        
        // Accuracy recommendations
        if (perfectPercentage.current < 30) {
            recommendations.push({
                icon: "🎯",
                text: "Focus on timing rather than speed for better accuracy"
            });
        }
        
        // Speed recommendations
        if (cpm < 10) {
            recommendations.push({
                icon: "⚡",
                text: "Practice in Rush mode to improve reaction time"
            });
        }
        
        // Error recommendations
        if (errorPercentage.current > 40) {
            recommendations.push({
                icon: "📐",
                text: "Pay attention to block alignment for better precision"
            });
        }
        
        // Timing recommendations
        if (timingErrorAvg > 100) {
            recommendations.push({
                icon: "⏱️",
                text: "Work on consistent timing to reduce errors"
            });
        }
        
        // Positive reinforcement
        if (gameStats.longestCombo.isRecord) {
            recommendations.push({
                icon: "🏆",
                text: "Great job breaking your combo record!"
            });
        }
        
        if (focusIndex > allTimeStats.averageFocusIndex) {
            recommendations.push({
                icon: "📈",
                text: "Your focus is improving! Keep it up!"
            });
        }
        
        // Default recommendation if no specific ones
        if (recommendations.length === 0) {
            recommendations.push({
                icon: "💪",
                text: "Keep practicing to improve your skills!"
            });
        }
        
        return recommendations.slice(0, 4); // Max 4 recommendations
    }

    // Callback setters
    setOnPlayAgain(callback) {
        this.onPlayAgain = callback;
    }

    setOnViewStats(callback) {
        this.onViewStats = callback;
    }
}