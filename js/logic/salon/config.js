// ── config.js ──────────────────────────────────────────
// Constantes y estado global de la landing

export const SVC_MAP = {
  manicure_spa:   { nombre: 'Manicure Spa',        precio: '$55.000' },
  pedicure_spa:   { nombre: 'Pedicure Spa',         precio: '$90.000' },
  unas_acrilicas: { nombre: 'Uñas acrílicas',       precio: '$45.000' },
  nail_art:       { nombre: 'Nail Art (Decoración)', precio: '$40.000' },
};

export const EST_MAP = {
  ana_torres: 'Ana Torres',
  luis_gomez: 'Luis Gómez',
  ana_sofia:  'Ana Sofía',
};

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

export const DIAS_SEM = [
  'domingo','lunes','martes','miércoles','jueves','viernes','sábado',
];

// Estado mutable compartido entre módulos
export const state = {
  calFecha:     new Date(),
  paso:         1,
  fechaISO:     null,
  fechaTxt:     null,
  horaSel:      null,
  estilistaSel: null,
  disp:         {},
  citas:        [],
};