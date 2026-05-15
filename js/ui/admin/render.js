// ── render.js ──────────────────────────────────────────
// Renderizado de métricas y tabla de citas

import { state } from '../../logic/admin/config.js';

/* ── Filtrado y ordenamiento ── */

export function getFiltered() {
  let data = [...state.citas];

  if (state.filtroVista !== 'todas')
    data = data.filter(c => c.estado === state.filtroVista);

  if (state.filtroEst)
    data = data.filter(c => c.estilista?.id === state.filtroEst);

  const q = (document.getElementById('search-input')?.value ?? '').toLowerCase().trim();
  if (q) {
    data = data.filter(c =>
      c.cliente?.nombre_completo?.toLowerCase().includes(q) ||
      c.cliente?.telefono_raw?.includes(q)
    );
  }

  const svc = document.getElementById('filter-svc')?.value ?? '';
  if (svc) {
    data = data.filter(c => c.servicio?.id === svc);
  }

  data.sort((a, b) => {
    let av, bv;
    if (state.sortField === 'cliente') {
      av = a.cliente?.nombre_completo ?? '';
      bv = b.cliente?.nombre_completo ?? '';
    } else if (state.sortField === 'fecha') {
      av = (a.fecha_cita ?? '') + (a.hora_cita ?? '');
      bv = (b.fecha_cita ?? '') + (b.hora_cita ?? '');
    } else {
      av = a.fecha_creacion ?? '';
      bv = b.fecha_creacion ?? '';
    }
    return av < bv ? -state.sortDir : av > bv ? state.sortDir : 0;
  });

  return data;
}

export function sortBy(field) {
  if (state.sortField === field) state.sortDir *= -1;
  else { state.sortField = field; state.sortDir = 1; }
  renderTable();
}

/* ── Métricas ── */

export function renderMetrics() {
  const all = state.citas;
  const byStatus = status => all.filter(c => c.estado === status).length;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('m-total', all.length);
  set('m-pend',  byStatus('pendiente'));
  set('m-conf',  byStatus('confirmada'));
  set('m-comp',  byStatus('completada'));

  const counts = {
    todas: all.length,
    pendiente:  byStatus('pendiente'),
    confirmada: byStatus('confirmada'),
    cancelada:  byStatus('cancelada'),
    completada: byStatus('completada'),
  };
  for (const [estado, val] of Object.entries(counts)) {
    set(`cnt-${estado}`, val);
  }
}

/* ── Tabla ── */

export function renderTable() {
  const data  = getFiltered();
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('empty-state');
  const count = document.getElementById('result-count');

  if (count) count.textContent = `${data.length} ${data.length === 1 ? 'cita' : 'citas'}`;

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(c => {
    const reg      = new Date(c.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    const adminTag = c.creada_por === 'admin'
      ? `<span class="badge-admin-tag" title="Creada desde admin">✦</span>`
      : '';
    // IDs y textos son escapados antes de insertarse en el DOM
    return `<tr onclick="verDetalle('${esc(c.id)}')">
      <td class="td-id">${esc(c.id)}${adminTag}</td>
      <td class="td-cliente">
        <strong>${esc(c.cliente?.nombre_completo ?? '—')}</strong>
        <span>+57 ${esc(c.cliente?.telefono_raw ?? '')}</span>
      </td>
      <td>
        <span class="f-dia">${esc(c.fecha_cita ?? '—')}</span>
        <span class="f-hora">${c.hora_cita ? '⏱ ' + esc(c.hora_cita) + ' h' : ''}</span>
        <span class="f-reg">reg. ${reg}</span>
      </td>
      <td style="font-size:12px">${esc(c.servicio?.nombre ?? '—')}</td>
      <td style="font-size:12px">${esc(c.estilista?.nombre ?? '—')}</td>
      <td><span class="badge badge-${esc(c.estado)}">${esc(c.estado)}</span></td>
      <td onclick="event.stopPropagation()">
        <button class="btn-tbl danger" onclick="eliminarCita('${esc(c.id)}')">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

export function render() {
  renderMetrics();
  renderTable();
}

/* ── Util: escape HTML para valores en templates ── */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}