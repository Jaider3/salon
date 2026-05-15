// ── detail.js ──────────────────────────────────────────
// Panel de detalle y acciones sobre una cita

import { state, EST_LBL } from '../../logic/admin/config.js';
import { updateCita, deleteCita } from '../../logic/admin/db.js';
import { openPanel, closePanel, showToast } from './ui.js';

export function verDetalle(id) {
  const c = state.citas.find(x => x.id === id);
  if (!c) return;

  const origenTag = c.creada_por === 'estilista'
    ? `<span style="font-size:10px;color:var(--gold);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:3px;padding:2px 8px;font-family:var(--font-mono)">✦ Estilista</span>`
    : `<span style="font-size:10px;color:var(--blue);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:3px;padding:2px 8px;font-family:var(--font-mono)">🌐 Web</span>`;

  const estOptions = Object.entries(EST_LBL).map(([val, label]) =>
    `<option value="${val}" ${c.estilista?.id === val ? 'selected' : ''}>${label}</option>`
  ).join('');

  const fechaFmt = c.fecha_cita ? c.fecha_cita.split('-').reverse().join('/') : '—';

  document.getElementById('detail-body').innerHTML = `
    <div class="d-row"><span class="d-key">ID</span><span class="d-val">${c.id}</span></div>
    <div class="d-row"><span class="d-key">Origen</span><span class="d-val">${origenTag}</span></div>
    <div class="d-row"><span class="d-key">Cliente</span><span class="d-val">${c.cliente?.nombre_completo ?? '—'}</span></div>
    <div class="d-row"><span class="d-key">Teléfono</span><span class="d-val">+57 ${c.cliente?.telefono_raw ?? '—'}</span></div>
    <div class="d-row"><span class="d-key">Servicio</span><span class="d-val">${c.servicio?.nombre ?? '—'}</span></div>
    <div class="d-row"><span class="d-key">Fecha</span><span class="d-val">${fechaFmt}</span></div>
    <div class="d-row"><span class="d-key">Hora</span><span class="d-val" style="color:var(--gold)">${c.hora_cita ?? '—'} h</span></div>
    <div class="d-row">
      <span class="d-key">Estilista</span>
      <span class="d-val">
        <select class="d-select" onchange="cambiarEstilista('${c.id}', this.value)">
          ${estOptions}
        </select>
      </span>
    </div>
    <div class="d-row"><span class="d-key">Estado</span><span class="d-val"><span class="badge badge-${c.estado}">${c.estado}</span></span></div>
    ${c.notas ? `<div class="d-row"><span class="d-key">Notas</span><span class="d-val" style="font-style:italic;color:var(--text-2)">${c.notas}</span></div>` : ''}
  `;

  document.getElementById('detail-actions').innerHTML = `
    <button class="btn-status btn-confirmar" onclick="cambiarEstado('${c.id}','confirmada')">✓ Confirmar</button>
    <button class="btn-status btn-completar" onclick="cambiarEstado('${c.id}','completada')">★ Completar</button>
    <button class="btn-status btn-cancelar"  onclick="cambiarEstado('${c.id}','cancelada')">✕ Cancelar</button>
    <button class="btn-status"
            style="border-color:var(--gold-border);color:var(--gold);flex-basis:100%"
            onclick="abrirReagendar('${c.id}')">📅 Reagendar</button>
  `;

  openPanel('detail-overlay');
}

export async function cambiarEstado(id, estado) {
  await updateCita(id, { estado });
  closePanel('detail-overlay');
}

export async function cambiarEstilista(citaId, nuevoEstId) {
  await updateCita(citaId, {
    estilista: { id: nuevoEstId, nombre: EST_LBL[nuevoEstId] },
  });
}

export async function eliminarCita(id) {
  if (!confirm('¿Eliminar esta cita permanentemente?')) return;
  try {
    await deleteCita(id);
    showToast('Cita eliminada', 'red');
  } catch (e) {
    console.error(e);
    showToast('Error al eliminar', 'red');
  }
}