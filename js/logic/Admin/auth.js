// ── auth.js ────────────────────────────────────────────
// Login / logout (credenciales en duro — solo para admin interno)

import { initApp } from './app.js';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'sofia2025';
const SESSION_KEY = 'salon_admin';

export function doLogin() {
  const user = document.getElementById('lu')?.value ?? '';
  const pass = document.getElementById('lp')?.value ?? '';

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, '1');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  } else {
    document.getElementById('login-err').style.display = 'block';
  }
}

export function doLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

export function autoLogin() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  }
}