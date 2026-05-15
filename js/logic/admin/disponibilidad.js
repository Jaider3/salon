// ── disponibilidad.js ──────────────────────────────────
// Editor de disponibilidad: calendario de días, horas base, bloqueos manuales

import { state, EST_LBL, MESES } from './config.js';
import { loadDisp, saveDisp } from '.dDb.js';
import { openPanel, activarNav, showToast } from '../../ui/admin/ui.js';

/* ── Abrir panel ── */

export async function abrirDisponibilidad(est, el) {
  state.avEst = est;
  state.avCal = new Date();
  state.avTab = 'dias';
  activarNav(el);
  document.getElementById('avail-title').innerHTML = `Agenda <em>${EST_LBL[est] ?? est}</em>`;
  await switchTab('dias');
  openPanel('avail-overlay');
}

/* ── Tabs ── */

export async function switchTab(t) {
  state.avTab = t;
  ['dias', 'horas', 'ocup'].forEach(x => {
    document.getElementById(`atab-${x}`).classList.toggle('active', x === t);
    document.getElementById(`avail-${x}`).style.display = x === t ? 'block' : 'none';
  });
  if (t === 'dias')  await renderAvCal();
  if (t === 'horas') await renderHrsEditor();
  if (t === 'ocup')  await renderOcc();
}

/* ── Calendario de días ── */

export async function renderAvCal() {
  const disp = await loadDisp();
  const a    = state.avCal.getFullYear();
  const m    = state.avCal.getMonth();

  document.getElementById('av-lbl').textContent = `${MESES[m]} ${a}`;

  const monthKey   = `${a}-${String(m + 1).padStart(2, '0')}`;
  const diasActivos = new Set(disp[state.avEst]?.dias?.[monthKey] ?? []);
  const hoy        = new Date().toLocaleDateString('sv-SE');
  const primerDow  = (new Date(a, m, 1).getDay() + 6) % 7;
  const diasMes    = new Date(a, m + 1, 0).getDate();

  let html = '<div class="av-day empty"></div>'.repeat(primerDow);
  for (let d = 1; d <= diasMes; d++) {
    const iso    = `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const activo = diasActivos.has(d);
    const pasado = iso < hoy;
    html += `<div class="av-day ${activo ? 'disp' : 'no-disp'} ${pasado ? 'pasado' : ''}"
             onclick="${pasado ? '' : `toggleDia(${d},${m},${a})`}">${d}</div>`;
  }
  document.getElementById('av-grid').innerHTML = html;
}

export async function toggleDia(d, m, a) {
  const key  = `${a}-${String(m + 1).padStart(2, '0')}`;
  const disp = await loadDisp();
  if (!disp[state.avEst].dias) disp[state.avEst].dias = {};
  if (!disp[state.avEst].dias[key]) disp[state.avEst].dias[key] = [];
  const arr = disp[state.avEst].dias[key];
  const idx = arr.indexOf(d);
  idx > -1 ? arr.splice(idx, 1) : arr.push(d);
  await saveDisp(disp);
  await renderAvCal();
}

export function avMes(delta) {
  state.avCal.setMonth(state.avCal.getMonth() + delta);
  renderAvCal();
}

/* ── Editor de horas base ── */

export async function renderHrsEditor() {
  const disp = await loadDisp();
  ['semana', 'sabado'].forEach(tipo => {
    const base = disp[state.avEst]?.horasBase?.[tipo] ?? [];
    document.getElementById(`he-${tipo}`).innerHTML = base.map((s, i) =>
      `<button class="hr-btn ${s.activa ? 'on' : 'off'}" onclick="toggleHr('${tipo}',${i})">${s.hora}</button>`
    ).join('');
  });
}

export async function toggleHr(tipo, idx) {
  const disp = await loadDisp();
  disp[state.avEst].horasBase[tipo][idx].activa = !disp[state.avEst].horasBase[tipo][idx].activa;
  await saveDisp(disp);
  await renderHrsEditor();
}

/* ── Bloqueos manuales (horas ocupadas) ── */

export async function renderOcc() {
  const disp      = await loadDisp();
  const occ       = disp[state.avEst]?.horasOcupadas ?? {};
  const keys      = Object.keys(occ).filter(f => occ[f]?.length > 0).sort();
  const container = document.getElementById('occ-list');

  if (keys.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:var(--text-3);font-style:italic;padding:10px 0;">No hay bloqueos manuales.</p>';
    return;
  }

  container.innerHTML = keys.map(f =>
    `<div class="occ-row">
      <span class="occ-date">${f}</span>
      <div class="occ-chips">${occ[f].map(h =>
        `<span class="occ-chip" onclick="removeOcc('${f}','${h}')">${h} ✕</span>`
      ).join('')}</div>
    </div>`
  ).join('');
}

export async function addOcc() {
  const f = document.getElementById('occ-fecha').value;
  const h = document.getElementById('occ-hora').value;
  if (!f || !h) return;

  const disp = await loadDisp();
  if (!disp[state.avEst].horasOcupadas) disp[state.avEst].horasOcupadas = {};
  if (!disp[state.avEst].horasOcupadas[f]) disp[state.avEst].horasOcupadas[f] = [];
  disp[state.avEst].horasOcupadas[f].push(h.substring(0, 5));

  await saveDisp(disp);
  await renderOcc();
}

export async function removeOcc(fecha, hora) {
  try {
    const disp = await loadDisp();
    if (!disp[state.avEst]?.horasOcupadas?.[fecha]) return;
    disp[state.avEst].horasOcupadas[fecha] =
      disp[state.avEst].horasOcupadas[fecha].filter(h => h !== hora);
    if (disp[state.avEst].horasOcupadas[fecha].length === 0)
      delete disp[state.avEst].horasOcupadas[fecha];
    await saveDisp(disp);
    await renderOcc();
    showToast(`Hora ${hora} desbloqueada`, 'green');
  } catch (e) {
    console.error(e);
    showToast('Error al eliminar', 'red');
  }
}