// ── form.js ────────────────────────────────────────────
// Envío del formulario, sanitización y pantalla de éxito

import { state, SVC_MAP, EST_MAP } from '../../logic/salon/config.js';
import { guardarCita } from '../../logic/salon/db.js';

export async function enviarFormulario() {
  const svcEl = document.querySelector('input[name=servicio]:checked');
  const estEl = document.querySelector('input[name=estilista]:checked');
  if (!svcEl) { alert('Por favor selecciona un tipo de servicio.'); return; }
  if (!estEl) { alert('Por favor selecciona una estilista.'); return; }

  const nombre   = sanitizeText(document.getElementById('nombre').value);
  const apellido = sanitizeText(document.getElementById('apellido').value);
  const tel      = sanitizePhone(document.getElementById('telefono').value);

  const svc  = SVC_MAP[svcEl.value];
  const cita = {
    id:              `CITA-${Date.now()}`,
    fecha_creacion:  new Date().toISOString(),
    fecha_cita:      state.fechaISO,
    hora_cita:       state.horaSel,
    fecha_hora_texto:`${state.fechaTxt} · ${state.horaSel} h`,
    cliente: {
      nombre,
      apellido,
      nombre_completo: `${nombre} ${apellido}`,
      telefono_raw:    tel,
      telefono_wsp:    `57${tel}`,
    },
    servicio: {
      id:     svcEl.value,
      nombre: svc.nombre,
      precio: svc.precio,
    },
    estilista: {
      id:     estEl.value,
      nombre: EST_MAP[estEl.value],
    },
    estado: 'pendiente',
  };

  const btn = document.getElementById('btn-next');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    await guardarCita(cita);
    mostrarExito(cita, nombre);
  } catch (e) {
    console.error('Error guardando cita:', e);
    alert('Hubo un error al guardar la cita. Intenta de nuevo.');
    btn.disabled    = false;
    btn.textContent = 'Confirmar cita';
  }
}

function mostrarExito(cita, nombre) {
  document.getElementById('steps-body').style.display  = 'none';
  const suc = document.getElementById('form-success');
  suc.style.display = 'flex';
  document.getElementById('suc-text').innerHTML =
    `¡Gracias, <strong>${nombre}</strong>! Tu cita de
     <strong>${cita.servicio.nombre}</strong> con
     <strong>${cita.estilista.nombre}</strong> está agendada para el
     <strong>${cita.fecha_hora_texto}</strong>.
     Te confirmaremos al +57 ${document.getElementById('telefono').value}.`;
}

/* ── Sanitización ── */
function sanitizeText(val = '') {
  return val.trim().replace(/[<>]/g, '').slice(0, 100);
}

function sanitizePhone(val = '') {
  return val.replace(/\D/g, '').slice(0, 15);
}