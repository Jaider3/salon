// ── app.js ─────────────────────────────────────────────
// Inicialización de la app y punto de entrada

import { subscribeToAppointments } from './Db.js';
import { render } from '../../ui/Admin/render.js';
import { initCrearPanel } from '../../ui/Admin/crear.js';
import { startClock } from '../../ui/Admin/ui.js';

export function initApp() {
  subscribeToAppointments(render);
  startClock();
  document.getElementById('search-input')?.addEventListener('input', render);
  initCrearPanel(); // puebla los grids del panel que ya está en el HTML
}