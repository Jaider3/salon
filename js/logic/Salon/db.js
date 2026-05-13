// ── db.js ──────────────────────────────────────────────
// Capa de acceso a Firestore

import { db } from '../../services/DB.js';
import {
  collection, doc,
  getDocs, setDoc,
} from 'firebase/firestore';

import { state } from './config.js';

export async function loadDisp() {
  try {
    const snap = await getDocs(collection(db, 'disponibilidad'));
    snap.docs.forEach(d => { state.disp[d.id] = d.data(); });
  } catch (e) {
    console.error('Error cargando disponibilidad:', e);
  }
}

export async function loadCitas() {
  try {
    const snap = await getDocs(collection(db, 'citas'));
    state.citas = snap.docs.map(d => d.data());
  } catch (e) {
    console.error('Error cargando citas:', e);
  }
}

export async function guardarCita(cita) {
  await setDoc(doc(db, 'citas', cita.id), cita);
  state.citas.push(cita);
}