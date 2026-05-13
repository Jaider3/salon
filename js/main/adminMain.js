// ── main.js ────────────────────────────────────────────
// Entry point: importa todos los módulos y expone funciones al scope global

import { state } from '../logic/Admin/config.js';
import { doLogin, doLogout, autoLogin } from '../logic/Admin/auth.js';
import { render, renderTable, sortBy } from '../ui/Admin/render.js';
import { verDetalle, cambiarEstado, cambiarEstilista, eliminarCita } from '../ui/Admin/detail.js';
import { abrirCrearCita, guardarNuevaCita, onCrearFechaChange } from '../ui/Admin/crear.js';
import { abrirReagendar, onReagendarFechaChange, guardarReagendamiento } from '../ui/Admin/reagendar.js';
import {
  abrirDisponibilidad, switchTab, toggleDia, toggleHr,
  addOcc, removeOcc, avMes,
} from '../logic/Admin/disponibilidad.js';
import { openPanel, closePanel, closePanelBg, toggleSidebar, activarNav } from '../ui/Admin/ui.js';

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