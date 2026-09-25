import './style.css';
import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (container) {
    new Game(container);
  }
});
