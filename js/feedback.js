/**
 * Feedback System
 * Handles automatic feedback, popups, and encouragement messages
 */

export class FeedbackSystem {
    constructor() {
        this.feedbackContainer = null;
        this.createFeedbackContainer();
        this.encouragementMessages = {
            milestone: [
                "🎉 Great job!", "🔥 On fire!", "⭐ Fantastic!", "💫 Amazing!", 
                "🏆 Excellent!", "👑 Superb!", "🎊 Outstanding!", "⚡ Incredible!",
                "🌟 Brilliant!", "💎 Perfect!", "🚀 Phenomenal!", "🎯 Flawless!"
            ],
            gameOver: {
                excellent: ["🏆 Outstanding performance!", "👑 You're a legend!", "🔥 Absolutely amazing!"],
                good: ["🎉 Great job!", "⭐ Well played!", "💫 Nice work!"],
                okay: ["👍 Good effort!", "🎯 Keep it up!", "💪 You're improving!"],
                poor: ["🌱 Practice makes perfect!", "💪 Don't give up!", "🎯 You'll get it next time!"]
            }
        };
    }

    createFeedbackContainer() {
        // Create feedback container if it doesn't exist
        if (!document.getElementById('feedback-container')) {
            const container = document.createElement('div');
            container.id = 'feedback-container';
            container.className = 'feedback-container';
            document.body.appendChild(container);
            this.feedbackContainer = container;
        } else {
            this.feedbackContainer = document.getElementById('feedback-container');
        }
    }

    showMilestoneMessage(score) {
        if (score % 15 === 0 && score > 0) {
            const message = this.getRandomMessage(this.encouragementMessages.milestone);
            this.showPopup(message, 'milestone', 2000);
            return true;
        }
        return false;
    }

    showGameOverFeedback(stats) {
        const { score, perfectPercentage, focusIndex } = stats;
        
        let category = 'poor';
        if (focusIndex >= 80 || score >= 50) category = 'excellent';
        else if (focusIndex >= 60 || score >= 25) category = 'good';
        else if (focusIndex >= 40 || score >= 10) category = 'okay';
        
        const message = this.getRandomMessage(this.encouragementMessages.gameOver[category]);
        this.showPopup(message, 'game-over', 3000);
    }

    showComboFeedback(combo, mode) {
        if (combo >= 5) {
            let message = '';
            let duration = 200;
            
            if (combo >= 20) {
                message = '🔥 LEGENDARY COMBO!';
                duration = 200;
            } else if (combo >= 15) {
                message = '⚡ INCREDIBLE STREAK!';
                duration = 200;
            } else if (combo >= 10) {
                message = '🌟 AMAZING COMBO!';
                duration = 200;
            } else if (combo >= 5) {
                message = '💫 Great Streak!';
            }
            
            this.showPopup(message, 'combo', duration);
        }
    }

    showPerfectFeedback() {
        this.showPopup('✨ PERFECT!', 'perfect', 100);
    }

    showModeSpecificFeedback(message) {
        if (message) {
            this.showPopup(message, 'mode-specific', 250);
        }
    }

    showPopup(message, type, duration = 2000) {
        const popup = document.createElement('div');
        popup.className = `feedback-popup feedback-${type}`;
        popup.textContent = message;
        
        this.feedbackContainer.appendChild(popup);
        
        // Trigger animation
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });
        
        // Remove after duration
        setTimeout(() => {
            popup.classList.remove('show');
            popup.classList.add('hide');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 100);
        }, duration);
    }

    getRandomMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Focus-based feedback
    showFocusLevelFeedback(focusIndex) {
        let message = '';
        let type = 'focus';
        
        if (focusIndex >= 90) {
            message = '🧠 LASER FOCUS!';
        } else if (focusIndex >= 75) {
            message = '🎯 Highly Focused!';
        } else if (focusIndex >= 50) {
            message = '👁️ Good Focus!';
        } else if (focusIndex >= 25) {
            message = '💭 Stay Focused!';
        }
        
        if (message) {
            this.showPopup(message, type, 200);
        }
    }

    // Clear all popups
    clearAllPopups() {
        while (this.feedbackContainer.firstChild) {
            this.feedbackContainer.removeChild(this.feedbackContainer.firstChild);
        }
    }
}