// ── salonMain.js ───────────────────────────────────────
// Entry point de la landing — inicializa datos y expone al window

import { state } from '../logic/Salon/config.js';
import { loadDisp, loadCitas } from '../logic/Salon/db.js';
import { renderCal, cambiarMes, elegirDia, elegirHora } from '../ui/Salon/calendar.js';
import { abrirModal, cerrarModal, cerrarFuera, irPaso } from '../ui/Salon/modal.js';

/* ── Init ── */
async function inicializar() {
  await Promise.all([loadDisp(), loadCitas()]);
  if (state.estilistaSel) renderCal();
}

document.addEventListener('DOMContentLoaded', inicializar);

/* ── Nav scroll ── */
window.addEventListener('scroll', () => {
  document.querySelector('nav')?.classList.toggle('scrolled', window.scrollY > 10);
});

/* ── Escape cierra modal ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModal();
});

/* ── Formato teléfono ── */
function fmtTel(input) {
  const v = input.value.replace(/\D/g, '');
  let f   = v.substring(0, 3);
  if (v.length > 3) f += ' ' + v.substring(3, 6);
  if (v.length > 6) f += ' ' + v.substring(6, 10);
  input.value = f;
}

/* ── Elegir estilista ── */
function elegirEstilista(id) {
  state.estilistaSel = id;
  renderCal();
}

/* ── Exponer al scope global (requerido por onclick en el HTML) ── */
Object.assign(window, {
  abrirModal,
  cerrarModal,
  cerrarFuera,
  irPaso,
  cambiarMes,
  elegirDia,
  elegirHora,
  elegirEstilista,
  fmtTel,
});