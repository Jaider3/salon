// ── config.js ──────────────────────────────────────────
// Constantes globales y estado de la aplicación

export const EST_LBL = {
  ana_torres: 'Ana Torres',
  luis_gomez: 'Luis Gómez',
  ana_sofia:  'Ana Sofía',
};

export const SVC_MAP = {
  manicure_spa:   { nombre: 'Manicure spa',   duracion: 60, precio: '$55.000' },
  pedicure_spa: { nombre: 'Pedicure spa', duracion: 90, precio: '$90.000' },
  unas_acrilicas:       { nombre: 'Uñas acrilicas',   duracion: 50, precio: '$45.000' },
  nail_art:    { nombre: 'Nails Art (Decoración)',  duracion: 45, precio: '$40.000' },
};

export const VISTA_LBL = {
  todas:      'Todas las reservas del salón',
  pendiente:  'Pendientes de confirmar',
  confirmada: 'Citas confirmadas',
  cancelada:  'Citas canceladas',
  completada: 'Citas completadas',
};

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// Estado mutable compartido entre módulos
export const state = {
  citas:      [],
  filtroVista: 'todas',
  filtroEst:   null,
  sortField:   'fecha_creacion',
  sortDir:     -1,
  avEst:       null,
  avCal:       new Date(),
  avTab:       'dias',
  _dispCache:  null,
};