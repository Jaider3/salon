// ── availability.js ────────────────────────────────────
// Lógica pura: días disponibles y horas libres

import { state } from './config.js';

export function esDiaDisponible(d, m, a) {
  const est = state.estilistaSel;
  if (!est || !state.disp[est]) return false;
  const key  = `${a}-${String(m + 1).padStart(2, '0')}`;
  const dias = state.disp[est].dias?.[key] ?? [];
  return dias.includes(d);
}

export function getHorasParaFecha(fechaISO) {
  try {
    const est = state.estilistaSel;
    if (!est || !state.disp[est]) return [];

    const edata  = state.disp[est];
    const ahora  = new Date();
    const hoy    = ahora.toLocaleDateString('sv-SE');
    const esHoy  = fechaISO === hoy;
    const dow    = new Date(`${fechaISO}T12:00:00`).getDay();
    const tipo   = dow === 6 ? 'sabado' : 'semana';

    const base           = edata.horasBase?.[tipo] ?? [];
    const bloqueadas     = new Set(edata.horasOcupadas?.[fechaISO] ?? []);
    const ocupadasCitas  = new Set(
      state.citas
        .filter(c =>
          c.fecha_cita    === fechaISO &&
          c.estilista?.id === est &&
          c.estado        !== 'cancelada'
        )
        .map(c => c.hora_cita)
    );

    const minActual = esHoy
      ? ahora.getHours() * 60 + ahora.getMinutes() + 60
      : 0;

    return base
      .filter(s => s.activa)
      .map(s => {
        const [hh, mm] = s.hora.split(':').map(Number);
        const minSlot  = hh * 60 + mm;
        const tomada   =
          bloqueadas.has(s.hora)    ||
          ocupadasCitas.has(s.hora) ||
          (esHoy && minSlot <= minActual);
        return { hora: s.hora, tomada };
      });
  } catch (e) {
    console.error('Error en getHorasParaFecha:', e);
    return [];
  }
}