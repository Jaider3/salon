// ── ui.js ──────────────────────────────────────────────
// Utilidades de interfaz: panels, toast, sidebar, nav, reloj

export function openPanel(id)  { document.getElementById(id)?.classList.add('open'); }
export function closePanel(id) { document.getElementById(id)?.classList.remove('open'); }

export function closePanelBg(e, id) {
  if (e.target.id === id) closePanel(id);
}

export function showToast(msg, color = 'green') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-dot').className   = `toast-dot ${color}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

export function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
}

export function activarNav(el) {
  if (!el) return;
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

export function startClock() {
  const tick = () => {
    const el = document.getElementById('topbar-time');
    if (el) el.textContent = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };
  setInterval(tick, 1000);
  tick();
}