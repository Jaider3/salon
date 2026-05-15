// ── modal.js ───────────────────────────────────────────
// Apertura/cierre del modal y navegación entre pasos

import { state } from '../../logic/salon/config.js';
import { renderCal, renderHoras } from './calendar.js';
import { enviarFormulario } from './form.js';

export function abrirModal(e) {
  e?.preventDefault();

  // Reset estado
  Object.assign(state, {
    paso:         1,
    fechaISO:     null,
    fechaTxt:     null,
    horaSel:      null,
    estilistaSel: null,
    calFecha:     new Date(),
  });

  // Reset DOM
  ['nombre', 'apellido', 'telefono'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
  document.getElementById('time-wrap').classList.add('dimmed');
  document.getElementById('hours-grid').innerHTML = '';
  document.getElementById('time-ph').textContent  = '← Primero elige un día disponible';
  document.getElementById('dt-badge').classList.remove('show');
  document.getElementById('steps-body').style.display  = 'block';
  document.getElementById('form-success').style.display = 'none';

  renderCal();
  renderPaso(1);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

export function cerrarFuera(e) {
  if (e.target === document.getElementById('modal-overlay')) cerrarModal();
}

export function renderPaso(n) {
  state.paso = n;
  [1, 2, 3].forEach(i => {
    document.getElementById(`step-${i}`).classList.toggle('active', i === n);
    const si = document.getElementById(`si-${i}`);
    const sn = document.getElementById(`sn-${i}`);
    si.className  = 'step-item' + (i === n ? ' active' : i < n ? ' done' : '');
    sn.textContent = i < n ? '✓' : String(i);
  });

  document.getElementById('btn-back').style.visibility = n > 1 ? 'visible' : 'hidden';

  const next = document.getElementById('btn-next');
  const note = document.getElementById('nav-note');
  if (n === 3) {
    next.className = 'btn-next wsp';
    next.innerHTML = 'Confirmar cita';
    note.innerHTML = 'Recibirás confirmación por <strong>WhatsApp</strong>';
  } else {
    next.className = 'btn-next';
    next.innerHTML = `Continuar <svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    note.innerHTML = '';
  }

  document.getElementById('modal').scrollTo({ top: 0, behavior: 'smooth' });
}

export async function irPaso(dir) {
  const { paso, fechaISO, horaSel } = state;

  if (dir > 0) {
    if (paso === 2) {
      if (!fechaISO) { alert('Por favor selecciona una fecha disponible.'); return; }
      if (!horaSel)  { alert('Por favor selecciona una hora.'); return; }
    }
    if (paso === 3) {
      const n = document.getElementById('nombre').value.trim();
      const a = document.getElementById('apellido').value.trim();
      const t = document.getElementById('telefono').value.replace(/\s/g, '');
      if (!n)          { alert('Por favor ingresa tu nombre.'); return; }
      if (!a)          { alert('Por favor ingresa tu apellido.'); return; }
      if (t.length < 10) { alert('Ingresa un número de WhatsApp válido (10 dígitos).'); return; }
      await enviarFormulario();
      return;
    }
  }

  renderPaso(paso + dir);
}