// ── availability.js ────────────────────────────────────
// Lógica pura para calcular horas disponibles de un estilista

import { state } from './config.js';
import { loadDisp } from './db.js';

export async function getHorasDisponibles(estId, fechaISO, excludeCitaId = null) {
  const disp  = await loadDisp();
  const eDisp = disp[estId];
  if (!eDisp) return [];

  const [a, m, d] = fechaISO.split('-').map(Number);
  const monthKey   = `${a}-${String(m).padStart(2, '0')}`;
  if (!(eDisp.dias?.[monthKey] ?? []).includes(d)) return [];

  const dow  = new Date(`${fechaISO}T12:00:00`).getDay();
  const tipo = dow === 6 ? 'sabado' : 'semana';
  const base = (eDisp.horasBase?.[tipo] ?? []).filter(s => s.activa).map(s => s.hora);

  const bloqueadas = new Set(eDisp.horasOcupadas?.[fechaISO] ?? []);

  const ocupadas = new Set(
    state.citas
      .filter(c =>
        c.id            !== excludeCitaId &&
        c.estilista?.id === estId &&
        c.fecha_cita    === fechaISO &&
        ['pendiente', 'confirmada'].includes(c.estado)
      )
      .map(c => c.hora_cita)
  );

  return base.filter(h => !bloqueadas.has(h) && !ocupadas.has(h));
}