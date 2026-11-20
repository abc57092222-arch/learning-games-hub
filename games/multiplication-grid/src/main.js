import { GameController } from './gameApp.js';

export function bootstrap() {
  const controller = new GameController();
  controller.init();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
