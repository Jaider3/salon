// ── calendar.js ────────────────────────────────────────
// Renderizado del calendario y selección de día/hora

import { state, MESES, MESES_ES, DIAS_SEM } from '../../logic/Salon/config.js';
import { esDiaDisponible, getHorasParaFecha } from '../../logic/Salon/availability.js';

export function renderCal() {
  const grid = document.getElementById('cal-grid');
  if (!state.estilistaSel) {
    grid.innerHTML = '<p style="font-size:12px;color:gray">Selecciona una estilista primero</p>';
    return;
  }

  const a   = state.calFecha.getFullYear();
  const m   = state.calFecha.getMonth();
  const hoy = new Date();
  const [ha, hm, hd] = [hoy.getFullYear(), hoy.getMonth(), hoy.getDate()];

  document.getElementById('cal-lbl').textContent = `${MESES[m]} ${a}`;

  const primerDow = (new Date(a, m, 1).getDay() + 6) % 7;
  const diasMes   = new Date(a, m + 1, 0).getDate();

  let html = '<div class="cal-day empty"></div>'.repeat(primerDow);
  for (let d = 1; d <= diasMes; d++) {
    const iso    = `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const pasado = new Date(a, m, d) < new Date(ha, hm, hd);
    const esHoy  = d === hd && m === hm && a === ha;
    const esDom  = ((primerDow + d - 1) % 7) === 6;
    const disp   = esDiaDisponible(d, m, a) && !esDom && !pasado;
    const selec  = iso === state.fechaISO;

    let cls = 'cal-day';
    if (selec)              cls += ' selected';
    else if (esHoy && disp) cls += ' is-today avail';
    else if (esHoy)         cls += ' is-today';
    else if (disp)          cls += ' avail';
    else                    cls += ' unavail';

    const onclick = disp ? `onclick="elegirDia(${d},${m},${a})"` : '';
    html += `<div class="${cls}" ${onclick}>${d}</div>`;
  }
  grid.innerHTML = html;
}

export function cambiarMes(dir) {
  state.calFecha.setMonth(state.calFecha.getMonth() + dir);
  renderCal();
}

export function elegirDia(d, m, a) {
  state.fechaISO = `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dsem     = DIAS_SEM[new Date(a, m, d).getDay()];
  state.fechaTxt = `${dsem[0].toUpperCase() + dsem.slice(1)}, ${d} de ${MESES_ES[m]} de ${a}`;
  state.horaSel  = null;

  renderCal();
  renderHoras();
  document.getElementById('time-wrap').classList.remove('dimmed');
  document.getElementById('time-ph').textContent =
    `Horarios disponibles para el ${d} de ${MESES_ES[m]}:`;
  actualizarBadge();
}

export function renderHoras() {
  const container = document.getElementById('hours-grid');
  if (!state.fechaISO) return;

  const slots = getHorasParaFecha(state.fechaISO);
  if (slots.length === 0) {
    container.innerHTML =
      '<p style="font-size:12px;color:var(--ink-50);font-style:italic">No hay horarios disponibles para este día.</p>';
    return;
  }

  container.innerHTML = slots.map(s => {
    const cls = ['hr-btn', s.tomada && 'hr-taken', s.hora === state.horaSel && 'hr-sel']
      .filter(Boolean).join(' ');
    return `<button class="${cls}" ${s.tomada ? 'disabled' : ''} onclick="elegirHora('${s.hora}')">${s.hora}</button>`;
  }).join('');
}

export function elegirHora(h) {
  state.horaSel = h;
  renderHoras();
  actualizarBadge();
}

export function actualizarBadge() {
  const badge = document.getElementById('dt-badge');
  const txt   = document.getElementById('dt-badge-txt');
  if (state.fechaTxt && state.horaSel) {
    txt.textContent = `${state.fechaTxt} · ${state.horaSel} h`;
    badge.classList.add('show');
  } else if (state.fechaTxt) {
    txt.textContent = `${state.fechaTxt} · elige una hora`;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }
}