// ── reagendar.js ───────────────────────────────────────
// Panel para reagendar citas existentes

import { state } from '../../logic/admin/config.js';
import { db } from '../../services/db.js';
import { doc, updateDoc } from 'firebase/firestore';
import { getHorasDisponibles } from '../../logic/admin/availability.js';
import { openPanel, closePanel, showToast } from './ui.js';

export async function abrirReagendar(id) {
  const c = state.citas.find(x => x.id === id);
  if (!c) return;

  if (!document.getElementById('reagendar-overlay')) {
    document.body.insertAdjacentHTML('beforeend', buildReagendarPanel());
  }

  const fechaEl = document.getElementById('rg-fecha');
  fechaEl.value           = c.fecha_cita ?? '';
  fechaEl.min             = new Date().toLocaleDateString('sv-SE');
  fechaEl.dataset.estId   = c.estilista?.id ?? '';

  document.getElementById('rg-cita-id').value          = id;
  document.getElementById('rg-est-nombre').textContent  = c.estilista?.nombre ?? '—';
  document.getElementById('rg-svc-nombre').textContent  = c.servicio?.nombre  ?? '—';
  document.getElementById('rg-cliente-nombre').textContent = c.cliente?.nombre_completo ?? '—';

  const horaEl = document.getElementById('rg-hora');
  horaEl.innerHTML = '<option value="">— Elige primero una fecha —</option>';
  horaEl.disabled  = true;

  if (c.fecha_cita) await onReagendarFechaChange(id);

  openPanel('reagendar-overlay');
}

export async function onReagendarFechaChange(citaIdOverride = null) {
  const fechaEl = document.getElementById('rg-fecha');
  const horaEl  = document.getElementById('rg-hora');
  const hintEl  = document.getElementById('rg-hora-hint');
  const fecha   = fechaEl.value;
  const estId   = fechaEl.dataset.estId;
  const citaId  = citaIdOverride ?? document.getElementById('rg-cita-id').value;

  if (!fecha || !estId) {
    horaEl.innerHTML = '<option value="">— Elige primero una fecha —</option>';
    horaEl.disabled  = true;
    return;
  }

  horaEl.innerHTML = '<option value="">Cargando…</option>';
  horaEl.disabled  = true;
  if (hintEl) hintEl.textContent = '';

  const horas = await getHorasDisponibles(estId, fecha, citaId);

  if (horas.length === 0) {
    horaEl.innerHTML = '<option value="">Sin horarios disponibles</option>';
    if (hintEl) hintEl.textContent = 'No hay horarios libres para este día.';
  } else {
    horaEl.innerHTML = '<option value="">Selecciona una hora</option>' +
      horas.map(h => `<option value="${h}">${h} h</option>`).join('');
    horaEl.disabled = false;
    const s = horas.length !== 1 ? 's' : '';
    if (hintEl) hintEl.textContent = `${horas.length} horario${s} disponible${s}`;
  }
}

export async function guardarReagendamiento() {
  const id    = document.getElementById('rg-cita-id').value;
  const fecha = document.getElementById('rg-fecha').value;
  const hora  = document.getElementById('rg-hora').value;

  if (!fecha) { showToast('Selecciona una fecha', 'amber'); return; }
  if (!hora)  { showToast('Selecciona una hora',  'amber'); return; }

  const btn = document.getElementById('rg-btn-guardar');
  btn.disabled    = true;
  btn.textContent = 'Guardando…';

  try {
    await updateDoc(doc(db, 'citas', id), {
      fecha_cita:    fecha,
      hora_cita:     hora,
      estado:        'confirmada',
      reagendada_en: new Date().toISOString(),
    });
    showToast('Cita reagendada ✓', 'green');
    closePanel('reagendar-overlay');
    closePanel('detail-overlay');
  } catch (e) {
    console.error(e);
    showToast('Error al reagendar', 'red');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirmar cambio';
  }
}

function buildReagendarPanel() {
  return `
  <div class="panel-overlay" id="reagendar-overlay" onclick="closePanelBg(event,'reagendar-overlay')">
    <div class="panel-box" style="max-width:440px">
      <div class="panel-hdr">
        <div class="panel-title">Reagendar <em>cita</em></div>
        <button class="panel-close" onclick="closePanel('reagendar-overlay')">✕</button>
      </div>
      <div class="panel-body">
        <input type="hidden" id="rg-cita-id">

        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-xs);padding:12px 14px;margin-bottom:20px">
          <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">Cita a modificar</div>
          <div style="font-size:13px;font-weight:500;color:var(--text)" id="rg-cliente-nombre"></div>
          <div style="font-size:12px;color:var(--text-2);margin-top:2px" id="rg-svc-nombre"></div>
          <div style="font-size:11px;color:var(--gold);font-family:var(--font-mono);margin-top:2px" id="rg-est-nombre"></div>
        </div>

        <div class="cc-section">
          <div class="cc-section-title">Nueva fecha y hora</div>
          <div class="cc-row-2">
            <div class="cc-field">
              <label class="cc-lbl" for="rg-fecha">Fecha</label>
              <input type="date" id="rg-fecha" onchange="onReagendarFechaChange()">
            </div>
            <div class="cc-field">
              <label class="cc-lbl" for="rg-hora">Hora disponible</label>
              <select id="rg-hora" disabled>
                <option value="">— Elige primero una fecha —</option>
              </select>
              <span class="cc-hint" id="rg-hora-hint"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="panel-actions" style="justify-content:flex-end;gap:8px">
        <button class="btn-status"
                style="flex:0;min-width:90px;border-color:var(--border-2);color:var(--text-2)"
                onclick="closePanel('reagendar-overlay')">Cancelar</button>
        <button class="btn-status btn-confirmar" id="rg-btn-guardar"
                style="flex:0;min-width:150px"
                onclick="guardarReagendamiento()">Confirmar cambio</button>
      </div>
    </div>
  </div>`;
}