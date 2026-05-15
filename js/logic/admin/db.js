// ── db.js ──────────────────────────────────────────────
// Capa de acceso a Firestore (citas + disponibilidad)

import { db } from '../../services/db.js';
import {
  collection, doc,
  getDocs, addDoc, updateDoc, deleteDoc,
  setDoc, onSnapshot,
} from 'firebase/firestore';

import { state } from './config.js';
import { showToast } from '../../ui/admin/ui.js';

/* ── Disponibilidad ── */

export async function loadDisp() {
  if (state._dispCache) return structuredClone(state._dispCache);
  try {
    const snap = await getDocs(collection(db, 'disponibilidad'));
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    state._dispCache = result;
    return structuredClone(result);
  } catch (e) {
    console.error('Error cargando disponibilidad:', e);
    return {};
  }
}

export async function saveDisp(data) {
  state._dispCache = null;
  for (const estId of Object.keys(data)) {
    await setDoc(doc(db, 'disponibilidad', estId), data[estId]);
  }
}

/* ── Citas ── */

export function subscribeToAppointments(onChange) {
  return onSnapshot(collection(db, 'citas'), snap => {
    state.citas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange();
  });
}

export async function addCita(data) {
  return addDoc(collection(db, 'citas'), data);
}

export async function updateCita(id, changes) {
  try {
    await updateDoc(doc(db, 'citas', id), changes);
    showToast('Actualizado correctamente', 'green');
  } catch {
    showToast('Error al actualizar', 'red');
  }
}

export async function deleteCita(id) {
  await deleteDoc(doc(db, 'citas', id));
}

