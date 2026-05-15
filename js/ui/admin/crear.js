// ── crear.js ───────────────────────────────────────────
// Panel de creación de citas (admin)

import { SVC_MAP, EST_LBL } from '../../logic/admin/config.js';
import { addCita } from '../../logic/admin/db.js';
import { getHorasDisponibles } from '../../logic/admin/availability.js';
import { openPanel, closePanel, showToast } from './ui.js';

/* ── Abrir panel ── */


// ── Poblar grids de servicio y estilista (se llama una vez al init) ──
export function initCrearPanel() {
  const svcGrid = document.getElementById('cc-svc-grid');
  const estGrid = document.getElementById('cc-est-grid');

  if (svcGrid) {
    svcGrid.innerHTML = Object.entries(SVC_MAP).map(([id, s]) => `
      <label class="cc-svc-opt">
        <input type="radio" name="cc-servicio" value="${id}"
          onchange="document.querySelectorAll('.cc-svc-card').forEach(c=>c.classList.remove('selected'));
                    this.closest('.cc-svc-opt').querySelector('.cc-svc-card').classList.add('selected')">
        <div class="cc-svc-card">
          <div class="cc-svc-dot"></div>
          <div>
            <div class="cc-svc-name">${s.nombre}</div>
            <div class="cc-svc-detail">${s.duracion} min · ${s.precio}</div>
          </div>
        </div>
      </label>`).join('');
  }

  if (estGrid) {
    estGrid.innerHTML = Object.entries(EST_LBL).map(([id, nombre]) => `
      <label class="cc-est-opt">
        <input type="radio" name="cc-estilista" value="${id}"
          onchange="document.querySelectorAll('.cc-est-card').forEach(c=>c.classList.remove('selected'));
                    this.closest('.cc-est-opt').querySelector('.cc-est-card').classList.add('selected');
                    onCrearFechaChange()">
        <div class="cc-est-card">
          <div class="cc-est-avatar">${nombre.charAt(0)}</div>
          <div class="cc-est-name">${nombre}</div>
        </div>
      </label>`).join('');
  }
}

export function abrirCrearCita(estId = null) {
  resetCrearForm();

  if (estId) {
    const radio = document.querySelector(`.cc-est-opt input[value="${estId}"]`);
    if (radio) {
      radio.checked = true;
      radio.closest('.cc-est-opt').querySelector('.cc-est-card').classList.add('selected');
    }
  }

  openPanel('crear-overlay');
}

function resetCrearForm() {
  document.querySelectorAll('.cc-svc-opt input, .cc-est-opt input')
    .forEach(r => { r.checked = false; });
  document.querySelectorAll('.cc-svc-card, .cc-est-card')
    .forEach(c => c.classList.remove('selected'));

  ['cc-nombre', 'cc-apellido', 'cc-telefono', 'cc-notas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const fechaInp = document.getElementById('cc-fecha');
  if (fechaInp) {
    fechaInp.value = '';
    fechaInp.min   = new Date().toLocaleDateString('sv-SE');
  }

  resetHoraSelect('cc-hora', '— Elige fecha y estilista —');
  setHint('cc-hora-hint', '');
  clearCrearErrors();
}

/* ── Cambio de fecha/estilista → recalcular horas ── */

export async function onCrearFechaChange() {
  const fecha    = document.getElementById('cc-fecha')?.value;
  const estRadio = document.querySelector('.cc-est-opt input:checked');

  if (!fecha || !estRadio) {
    resetHoraSelect('cc-hora', '— Elige fecha y estilista —');
    setHint('cc-hora-hint', '');
    return;
  }

  resetHoraSelect('cc-hora', 'Cargando…', true);
  setHint('cc-hora-hint', '');

  try {
    const horas = await getHorasDisponibles(estRadio.value, fecha);
    populateHoraSelect('cc-hora', 'cc-hora-hint', horas);
  } catch (e) {
    resetHoraSelect('cc-hora', 'Error al cargar');
    console.error(e);
  }
}

/* ── Guardar ── */

export async function guardarNuevaCita() {
  clearCrearErrors();

  const nombre   = sanitizeText(document.getElementById('cc-nombre')?.value);
  const apellido = sanitizeText(document.getElementById('cc-apellido')?.value);
  const tel      = sanitizePhone(document.getElementById('cc-telefono')?.value);
  const fecha    = document.getElementById('cc-fecha')?.value    ?? '';
  const hora     = document.getElementById('cc-hora')?.value     ?? '';
  const notas    = sanitizeText(document.getElementById('cc-notas')?.value);
  const svcRadio = document.querySelector('.cc-svc-opt input:checked');
  const estRadio = document.querySelector('.cc-est-opt input:checked');

  if (!validateCrearForm({ nombre, apellido, tel, fecha, hora, svcRadio, estRadio })) return;

  const svcObj = SVC_MAP[svcRadio.value];
  const cita   = {
    cliente: {
      nombre_completo: `${nombre} ${apellido}`,
      nombre,
      apellido,
      telefono_raw: tel,
    },
    servicio: {
      id:       svcRadio.value,
      nombre:   svcObj.nombre,
      duracion: svcObj.duracion,
      precio:   svcObj.precio,
    },
    estilista: {
      id:     estRadio.value,
      nombre: EST_LBL[estRadio.value],
    },
    fecha_cita:     fecha,
    hora_cita:      hora,
    estado:         'confirmada',
    notas,
    creada_por:     'estilista',
    fecha_creacion: new Date().toISOString(),
  };

  const btn = document.getElementById('cc-btn-guardar');
  setLoading(btn, true, 'Guardando…');

  try {
    await addCita(cita);
    showToast('¡Cita creada correctamente!', 'green');
    closePanel('crear-overlay');
  } catch (e) {
    console.error('Error guardando cita:', e);
    showToast('Error al guardar', 'red');
  } finally {
    setLoading(btn, false, '✦ Crear cita');
  }
}

/* ── Validación ── */

function validateCrearForm({ nombre, apellido, tel, fecha, hora, svcRadio, estRadio }) {
  let valid = true;
  if (!nombre)        { setCrearError('cc-nombre',   'Ingresa el nombre');    valid = false; }
  if (!apellido)      { setCrearError('cc-apellido', 'Ingresa el apellido');  valid = false; }
  if (tel.length < 7) { setCrearError('cc-telefono', 'Teléfono inválido');   valid = false; }
  if (!fecha)         { setCrearError('cc-fecha',    'Selecciona una fecha'); valid = false; }
  if (!hora)          { setCrearError('cc-hora',     'Selecciona una hora');  valid = false; }
  if (!svcRadio)      { setCrearError('cc-svc-err',  'Elige un servicio');    valid = false; }
  if (!estRadio)      { setCrearError('cc-est-err',  'Elige una estilista');  valid = false; }
  return valid;
}

export function setCrearError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const isField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
  if (isField) {
    el.classList.add('cc-error');
    let hint = el.parentNode.querySelector('.cc-err-msg');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'cc-err-msg';
      el.parentNode.appendChild(hint);
    }
    hint.textContent = msg;
  } else {
    el.textContent   = msg;
    el.style.display = 'block';
  }
}

export function clearCrearErrors() {
  document.querySelectorAll('.cc-error').forEach(el => el.classList.remove('cc-error'));
  document.querySelectorAll('.cc-err-msg').forEach(el => el.remove());
  ['cc-svc-err', 'cc-est-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
}

/* ── HTML del panel (inyectado en initApp) ── */

export function buildCrearPanel() {
  const svcOptions = Object.entries(SVC_MAP).map(([id, s]) => `
    <label class="cc-svc-opt">
      <input type="radio" name="cc-servicio" value="${id}"
        onchange="document.querySelectorAll('.cc-svc-card').forEach(c=>c.classList.remove('selected'));
                  this.closest('.cc-svc-opt').querySelector('.cc-svc-card').classList.add('selected')">
      <div class="cc-svc-card">
        <div class="cc-svc-dot"></div>
        <div>
          <div class="cc-svc-name">${s.nombre}</div>
          <div class="cc-svc-detail">${s.duracion} min · ${s.precio}</div>
        </div>
      </div>
    </label>`).join('');

  const estOptions = Object.entries(EST_LBL).map(([id, nombre]) => `
    <label class="cc-est-opt">
      <input type="radio" name="cc-estilista" value="${id}"
        onchange="document.querySelectorAll('.cc-est-card').forEach(c=>c.classList.remove('selected'));
                  this.closest('.cc-est-opt').querySelector('.cc-est-card').classList.add('selected');
                  onCrearFechaChange()">
      <div class="cc-est-card">
        <div class="cc-est-avatar">${nombre.charAt(0)}</div>
        <div class="cc-est-name">${nombre}</div>
      </div>
    </label>`).join('');

  return `
  <div class="panel-overlay" id="crear-overlay" onclick="closePanelBg(event,'crear-overlay')">
    <div class="panel-box" style="max-width:580px">
      <div class="panel-hdr">
        <div class="panel-title">Nueva <em>cita</em></div>
        <button class="panel-close" onclick="closePanel('crear-overlay')">✕</button>
      </div>
      <div class="panel-body" id="crear-cita-form">

        <div class="cc-section">
          <div class="cc-section-title">Servicio</div>
          <div class="cc-svc-grid">${svcOptions}</div>
          <span class="cc-err-group" id="cc-svc-err"></span>
        </div>

        <div class="cc-section">
          <div class="cc-section-title">Estilista</div>
          <div class="cc-est-grid">${estOptions}</div>
          <span class="cc-err-group" id="cc-est-err"></span>
        </div>

        <div class="cc-section">
          <div class="cc-section-title">Fecha y hora</div>
          <div class="cc-row-2">
            <div class="cc-field">
              <label class="cc-lbl" for="cc-fecha">Fecha</label>
              <input type="date" id="cc-fecha" onchange="onCrearFechaChange()">
            </div>
            <div class="cc-field">
              <label class="cc-lbl" for="cc-hora">Hora disponible</label>
              <select id="cc-hora" disabled>
                <option value="">— Elige fecha y estilista —</option>
              </select>
              <span class="cc-hint" id="cc-hora-hint"></span>
            </div>
          </div>
        </div>

        <div class="cc-section">
          <div class="cc-section-title">Datos del cliente</div>
          <div class="cc-row-2">
            <div class="cc-field">
              <label class="cc-lbl" for="cc-nombre">Nombre</label>
              <input type="text" id="cc-nombre" placeholder="María" autocomplete="off" maxlength="60">
            </div>
            <div class="cc-field">
              <label class="cc-lbl" for="cc-apellido">Apellido</label>
              <input type="text" id="cc-apellido" placeholder="García" autocomplete="off" maxlength="60">
            </div>
          </div>
          <div class="cc-field" style="margin-top:10px">
            <label class="cc-lbl" for="cc-telefono">Teléfono (WhatsApp)</label>
            <div class="cc-phone-wrap">
              <span class="cc-phone-prefix">🇨🇴 +57</span>
              <input type="tel" id="cc-telefono" class="cc-ph-input"
                     placeholder="310 000 0000" maxlength="13">
            </div>
          </div>
        </div>

        <div class="cc-section">
          <div class="cc-section-title">
            Notas internas <span style="color:var(--text-3);font-weight:300;letter-spacing:0">(opcional)</span>
          </div>
          <textarea id="cc-notas" class="cc-textarea"
                    placeholder="Preferencias, alergias, diseño especial…"
                    rows="3" maxlength="500"></textarea>
        </div>

      </div>
      <div class="panel-actions" style="justify-content:flex-end;gap:8px">
        <button class="btn-status"
                style="flex:0;min-width:90px;border-color:var(--border-2);color:var(--text-2)"
                onclick="closePanel('crear-overlay')">Cancelar</button>
        <button class="btn-status btn-confirmar" id="cc-btn-guardar"
                style="flex:0;min-width:140px"
                onclick="guardarNuevaCita()">✦ Crear cita</button>
      </div>
    </div>
  </div>`;
}

/* ── Helpers internos ── */

function resetHoraSelect(selectId, placeholder, disabled = true) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  el.disabled  = disabled;
}

function setHint(hintId, text) {
  const el = document.getElementById(hintId);
  if (el) el.textContent = text;
}

function populateHoraSelect(selectId, hintId, horas) {
  const el = document.getElementById(selectId);
  if (!el) return;
  if (horas.length === 0) {
    el.innerHTML = '<option value="">Sin horarios disponibles</option>';
    setHint(hintId, 'Este día no tiene horarios disponibles.');
  } else {
    el.innerHTML = '<option value="">Selecciona una hora</option>' +
      horas.map(h => `<option value="${h}">${h} h</option>`).join('');
    el.disabled = false;
    const s = horas.length !== 1 ? 's' : '';
    setHint(hintId, `${horas.length} horario${s} disponible${s}`);
  }
}

function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = text;
}

/* ── Sanitización de inputs ── */

function sanitizeText(val = '') {
  return val.trim().replace(/[<>]/g, '').slice(0, 200);
}

function sanitizePhone(val = '') {
  return val.replace(/\D/g, '').slice(0, 15);
}