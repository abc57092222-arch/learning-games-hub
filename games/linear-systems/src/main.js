import { setupAccessibleDialogs } from '../../../shared/ui/dialogHelper.js';
import { GameController } from './ui/gameController.js';

function initApp() {
  const rootEl = document.getElementById('game-root');
  const announcerEl = document.getElementById('sr-announcer');
  if (!rootEl) return;

  const announce = (msg) => {
    if (!announcerEl) return;
    announcerEl.textContent = '';
    requestAnimationFrame(() => {
      announcerEl.textContent = msg;
    });
  };

  const { closeAnimated } = setupAccessibleDialogs('dialog.lab-dialog');
  const dialogs = {
    map: document.getElementById('level-map-dialog'),
    help: document.getElementById('help-dialog'),
    closeAnimated,
  };

  window.__eqDetective = new GameController(rootEl, dialogs, announce);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
