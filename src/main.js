import { StatsManager } from './core/statsManager.js';
import { GameModes } from './core/gameModes.js';
import { FeedbackSystem } from './ui/feedbackSystem.js';
import { ReviewSystem } from './ui/reviewSystem.js';
import { UIController } from './ui/controller.js';
import { GameEngine } from './core/gameEngine.js';

window.focus();

const stats = new StatsManager();
const gameModes = new GameModes();
const feedback = new FeedbackSystem();
const review = new ReviewSystem();
const ui = new UIController({ stats, gameModes, feedback, review });

const engine = new GameEngine({ stats, gameModes, feedback, review, ui });

// Init
engine.init();

// Attach renderer canvas to body
engine.attachTo(document.body);

// Init UI (after renderer exists)
ui.init(engine);

// Global input handling
window.addEventListener('mousedown', (event) => {
  engine.handlePrimaryAction(event.target);
});

window.addEventListener('keydown', (event) => {
  if (event.key === ' ') {
    event.preventDefault();
    engine.handlePrimaryAction(document.activeElement || document.body);
  }
});

window.addEventListener('resize', () => engine.onResize());
