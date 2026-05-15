// ── app.js ─────────────────────────────────────────────
// Inicialización de la app y punto de entrada

import { subscribeToAppointments } from './db.js';
import { render } from '../../ui/admin/render.js';
import { initCrearPanel } from '../../ui/admin/crear.js';
import { startClock } from '../../ui/admin/ui.js';

export function initApp() {
  subscribeToAppointments(render);
  startClock();
  document.getElementById('search-input')?.addEventListener('input', render);
  initCrearPanel(); // puebla los grids del panel que ya está en el HTML
}