// ── main.js ────────────────────────────────────────────
// Entry point: importa todos los módulos y expone funciones al scope global

import { state } from '../logic/admin/config.js';
import { doLogin, doLogout, autoLogin } from '../logic/admin/auth.js';
import { render, renderTable, sortBy } from '../ui/admin/render.js';
import { verDetalle, cambiarEstado, cambiarEstilista, eliminarCita } from '../ui/admin/detail.js';
import { abrirCrearCita, guardarNuevaCita, onCrearFechaChange } from '../ui/admin/crear.js';
import { abrirReagendar, onReagendarFechaChange, guardarReagendamiento } from '../ui/admin/reagendar.js';
import {
  abrirDisponibilidad, switchTab, toggleDia, toggleHr,
  addOcc, removeOcc, avMes,
} from '../logic/admin/disponibilidad.js';
import { openPanel, closePanel, closePanelBg, toggleSidebar, activarNav } from '../ui/admin/ui.js';

/* ── Exponer al scope global (requerido por onclick en el HTML) ── */
Object.assign(window, {
  // Auth
  doLogin,
  doLogout,

  // Citas
  verDetalle,
  eliminarCita,
  cambiarEstado,
  cambiarEstilista,

  // Disponibilidad
  abrirDisponibilidad,
  switchTab,
  toggleDia,
  toggleHr,
  addOcc,
  removeOcc,

  // Sidebar
  toggleSidebar,

  // Crear cita
  abrirCrearCita,
  guardarNuevaCita,
  onCrearFechaChange,

  // Reagendar
  abrirReagendar,
  onReagendarFechaChange,
  guardarReagendamiento,

  // UI / navegación
  closePanel,
  openPanel,
  closePanelBg,
  render,

  setVista: (v, el) => {
    state.filtroVista = v;
    activarNav(el);
    render();
  },
  setEstilista: (id, el) => {
    state.filtroEst = id;
    activarNav(el);
    render();
  },
  avMes,
  sortBy,
});

/* ── Arrancar ── */
autoLogin();