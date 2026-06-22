/* ══════════════════════════════════════════
    ⚙️  CONFIGURACIÓN FIREBASE
   ══════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyDfqntcaJjhV8kLOGAuEdfhq8i8Q4LXxPM",
  authDomain: "apm-cbu.firebaseapp.com",
  projectId: "apm-cbu",
  storageBucket: "apm-cbu.firebasestorage.app",
  messagingSenderId: "374651059843",
  appId: "1:374651059843:web:b529355e8085d6f63725b6",
  measurementId: "G-HQDVKEQ9XT"
};

/* ═══════════════════════════════════════════════════════════
   ZONA HORARIA: Colombia GMT-5
═══════════════════════════════════════════════════════════ */
const TZ = "America/Bogota";

function toColDate(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit"
  }).formatToParts(date);
  const p = {};
  parts.forEach(({ type, value }) => { p[type] = value; });
  return { year: +p.year, month: +p.month, day: +p.day };
}

function sameColDay(a, b) {
  const ca = toColDate(a), cb = toColDate(b);
  return ca.year === cb.year && ca.month === cb.month && ca.day === cb.day;
}

function colDayOffset(offset) {
  const now = new Date();
  const { year, month, day } = toColDate(now);
  return new Date(Date.UTC(year, month - 1, day + offset, 5, 0, 0));
}

/* ─── ESTADO GLOBAL ─── */
let allOrders   = [];
let filterMode  = "todos";
let dayOffset   = 0;
let db;
let storage;
let unsubscribe = null;

/* ─── INIT ─── */
function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db      = firebase.firestore();
    storage = firebase.storage();
    subscribeToOrders();
  } catch (err) {
    console.warn("Firebase no configurado — modo demo:", err.message);
    runLocalDemo();
  }
}

/* ─── SUSCRIPCIÓN REALTIME ─── */
function subscribeToOrders() {
  if (unsubscribe) unsubscribe();

  const { year, month, day } = toColDate(colDayOffset(dayOffset));
  const startOfDay = firebase.firestore.Timestamp.fromDate(
    new Date(Date.UTC(year, month - 1, day, 5, 0, 0))
  );
  const endOfDay = firebase.firestore.Timestamp.fromDate(
    new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0))
  );

  unsubscribe = db.collection("pedidos")
    .where("fecha", ">=", startOfDay)
    .where("fecha", "<",  endOfDay)
    .orderBy("fecha", "desc")
    .onSnapshot(async snap => {
      allOrders = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id:            doc.id,
          num:           data.num || generateNum(doc),
          nombreCliente: data.nombreCliente || "",
          telefono:      data.telefono      || "",
          direccion:     data.direccion     || "",
          pedido:        data.pedido        || "",
          observaciones: data.observaciones || "",
          fecha:         data.fecha?.toDate?.() || new Date(),
          estado:        data.estado        || "Pendiente",
          tipo:          data.tipo          || "tienda",
          origen:        data.origen        || "manual",
          comprobante:   data.comprobante   || "",
          // ── Campos de pago ──
          tipoPago:      data.tipoPago      || "",
          monto:         data.monto         ?? null,   // int64 → number en JS
          total:         data.total         ?? null
        };
      });
      renderAll();
      hideLoading();
    }, err => { console.error(err); runLocalDemo(); });
}


function generateNum(doc) {
  return (doc.id.charCodeAt(0) % 900 + 100).toString().padStart(3, "0");
}

/* ─── NAVEGACIÓN DE FECHA ─── */
function updateDateLabel() {
  const textEl        = document.getElementById("date-text");
  const proofText     = document.getElementById("proof-date-text");
  const todayBtn      = document.getElementById("btn-today");
  const proofTodayBtn = document.getElementById("proof-btn-today");
  const nextBtn       = document.getElementById("btn-next-day");
  const proofNextBtn  = document.getElementById("proof-btn-next-day");

  if (dayOffset === 0) {
    textEl.textContent        = "Hoy";
    proofText.textContent     = "Hoy";
    todayBtn.style.display    = "none";
    proofTodayBtn.style.display = "none";
    nextBtn.disabled          = true;
    nextBtn.style.opacity     = "0.4";
    proofNextBtn.disabled     = true;
    proofNextBtn.style.opacity = "0.4";
  } else {
    const d = colDayOffset(dayOffset);
    const { year, month, day } = toColDate(d);
    const label = new Date(year, month - 1, day).toLocaleDateString("es-CO", {
      weekday: "short", day: "numeric", month: "long"
    });
    const formatted = label.charAt(0).toUpperCase() + label.slice(1);
    textEl.textContent        = formatted;
    proofText.textContent     = formatted;
    todayBtn.style.display    = "inline-flex";
    proofTodayBtn.style.display = "inline-flex";
    nextBtn.disabled          = dayOffset >= 0;
    nextBtn.style.opacity     = dayOffset >= 0 ? "0.4" : "1";
    proofNextBtn.disabled     = dayOffset >= 0;
    proofNextBtn.style.opacity = dayOffset >= 0 ? "0.4" : "1";
  }
}

document.getElementById("btn-prev-day").addEventListener("click", () => {
  dayOffset--; updateDateLabel(); subscribeToOrders();
});
document.getElementById("btn-next-day").addEventListener("click", () => {
  if (dayOffset < 0) { dayOffset++; updateDateLabel(); subscribeToOrders(); }
});
document.getElementById("btn-today").addEventListener("click", () => {
  dayOffset = 0; updateDateLabel(); subscribeToOrders();
});
document.getElementById("proof-btn-prev-day").addEventListener("click", () => {
  dayOffset--; updateDateLabel(); subscribeToOrders();
});
document.getElementById("proof-btn-next-day").addEventListener("click", () => {
  if (dayOffset < 0) { dayOffset++; updateDateLabel(); subscribeToOrders(); }
});
document.getElementById("proof-btn-today").addEventListener("click", () => {
  dayOffset = 0; updateDateLabel(); subscribeToOrders();
});

/* ─── RENDER ─── */
function renderAll() {
  updateStats();
  renderOrders();
  renderProofGrid();
}

function updateStats() {
  const c = { Pendiente: 0, "En preparación": 0, "En camino": 0, Entregado: 0 };
  allOrders.forEach(o => { if (c[o.estado] !== undefined) c[o.estado]++; });
  document.getElementById("stat-pendiente").textContent   = c["Pendiente"];
  document.getElementById("stat-preparacion").textContent = c["En preparación"];
  document.getElementById("stat-camino").textContent      = c["En camino"];
  document.getElementById("stat-entregado").textContent   = c["Entregado"];
}

function renderOrders() {
  const container = document.getElementById("orders-list");
  let list;
  if      (filterMode === "todos")     list = allOrders.filter(o => o.estado !== "Entregado");
  else if (filterMode === "Entregado") list = allOrders.filter(o => o.estado === "Entregado");
  else                                 list = allOrders.filter(o => o.estado === filterMode);

  if (!list.length) {
    container.innerHTML = `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>
      <p>${filterMode === "todos" ? "Sin pedidos activos para este día" : "No hay pedidos en este estado"}</p>
    </div>`;
    return;
  }

  container.innerHTML = list.map((o, i) => buildCard(o, i)).join("");

  container.querySelectorAll(".order-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".next-btn")) return;
      const o = allOrders.find(x => x.id === card.dataset.id);
      if (o) openModal(o);
    });
  });

  container.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      changeStatus(btn.dataset.id, btn.dataset.next);
    });
  });
}

function buildCard(order, i) {
  const ec   = estadoToClass(order.estado);
  const next = nextEstado(order.estado);
  const obs  = order.observaciones
    ? `<span class="order-obs">⚠ ${esc(order.observaciones)}</span>` : "";
  const nextBtn = next
    ? `<button class="next-btn" data-id="${order.id}" data-next="${esc(next)}">→ ${esc(next)}</button>`
    : `<span style="font-size:11px;color:var(--text-muted)">—</span>`;
  const tipoBadge   = buildTipoBadge(order.tipo);
  const pagoBadge   = buildPagoBadge(order.tipoPago);
  const totalDisplay = order.total != null
    ? `<span class="order-total">${formatCOP(order.total)}</span>` : "";

  return `
    <div class="order-card st-${ec}" data-id="${order.id}" style="animation-delay:${i * 35}ms">
      <div class="order-num">#${order.num}</div>
      <div>
        <div class="order-client-name">${esc(order.nombreCliente)}</div>
        <div style="margin-bottom:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          ${tipoBadge}
          ${pagoBadge}
          ${totalDisplay}
        </div>
        <div class="order-meta">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.21 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.13 1.07.37 2.12.72 3.14a2 2 0 01-.45 2.11L6.91 8.37A16 16 0 0015.63 17.1l1.5-1.5a2 2 0 012.11-.45c1.02.35 2.07.59 3.14.72A2 2 0 0122 16.92z"/></svg>
          ${esc(order.telefono)}
        </div>
        ${order.tipo === "domicilio" ? `
        <div class="order-meta">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(order.direccion)}${buildMapsBtn(order.direccion)}
        </div>` : ""}
      </div>
      <div>
        <div class="order-items">${esc(order.pedido)}</div>
        ${obs}
      </div>
      <div class="order-actions">
        <span class="status-badge badge-${ec}">${esc(order.estado)}</span>
        <span class="order-time">${formatTime(order.fecha)}</span>
        ${nextBtn}
      </div>
    </div>`;
}

/* ─── BADGES ─── */
function buildTipoBadge(tipo) {
  const map = {
    domicilio: { cls: "tipo-domicilio", icon: "🛵", label: "Domicilio" },
    tienda:    { cls: "tipo-tienda",    icon: "🍽️", label: "En tienda" }
  };
  const t = map[tipo] || map["tienda"];
  return `<span class="tipo-badge ${t.cls}">${t.icon} ${t.label}</span>`;
}

function buildPagoBadge(tipoPago) {
  if (!tipoPago) return "";
  const map = {
    efectivo:      { icon: "💵", label: "Efectivo" },
    transferencia: { icon: "📲", label: "Transferencia" },
    tarjeta:       { icon: "💳", label: "Tarjeta" },
    nequi:         { icon: "🟣", label: "Nequi" },
    daviplata:     { icon: "🔴", label: "Daviplata" }
  };
  const p = map[tipoPago] || { icon: "💰", label: tipoPago };
  return `<span class="tipo-badge tipo-pago">${p.icon} ${p.label}</span>`;
}

function buildMapsBtn(direccion) {
  if (!direccion?.trim()) return "";
  return `<a class="maps-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion + ", Medellín, Colombia")}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
    Maps
  </a>`;
}

/* ─── CAMBIAR ESTADO ─── */
async function changeStatus(orderId, newEstado) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  const prev = order.estado;
  order.estado = newEstado;
  updateStats();

  if (newEstado === "Entregado" && filterMode !== "Entregado") {
    const card = document.querySelector(`.order-card[data-id="${orderId}"]`);
    if (card) { card.classList.add("removing"); setTimeout(() => renderOrders(), 380); }
  } else {
    renderOrders();
  }

  if (orderId.startsWith("demo-")) {
    showToast(`Estado → ${newEstado}`);
    if (isModalOpen(orderId)) refreshModal(order);
    return;
  }

  try {
    await db.collection("pedidos").doc(orderId).update({ estado: newEstado });
    showToast(`Estado → ${newEstado}`);
    if (isModalOpen(orderId)) refreshModal(order);
  } catch (err) {
    order.estado = prev;
    renderOrders(); updateStats();
    showToast("Error al guardar");
  }
}

/* ─── MODAL DETALLE ─── */
let currentModalId = null;

function openModal(order) {
  currentModalId = order.id;
  document.getElementById("modal-title").textContent = `Pedido #${order.num}`;
  document.getElementById("modal-body").innerHTML = buildModalBody(order);
  document.getElementById("modal-overlay").classList.add("open");

  document.querySelectorAll(".modal-status-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("modal-overlay").classList.remove("open");
      currentModalId = null;
      changeStatus(order.id, btn.dataset.estado);
    });
  });

  const thumb = document.getElementById("modal-proof-thumb");
  if (thumb) thumb.addEventListener("click", () =>
    openLightbox(order.comprobante, `Comprobante — ${order.nombreCliente}`));
}

function buildModalBody(order) {
  const hora = order.fecha instanceof Date
    ? order.fecha.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const proofHtml = order.comprobante
    ? `<img id="modal-proof-thumb" class="comprobante-thumb" src="${esc(order.comprobante)}" alt="Comprobante" loading="lazy"/>`
    : `<div class="no-comprobante">📎 Sin comprobante adjunto</div>`;

  const statusBtns = ["Pendiente", "En preparación", "En camino", "Entregado"].map(est => {
    const sel = order.estado === est ? `sel-${estadoToClass(est)}` : "";
    return `<button class="modal-status-btn ${sel}" data-estado="${est}">${est}</button>`;
  }).join("");

  const origenMap = {
    whatsapp: { icon: "💬", label: "WhatsApp" },
    manual:   { icon: "✏️", label: "Creado manualmente" }
  };
  const origenInfo = origenMap[order.origen] || { icon: "📦", label: order.origen || "Desconocido" };

  const direccionRow = order.tipo === "domicilio" ? `
    <div class="modal-row">
      <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span class="modal-row-label">Dirección</span>
      <span class="modal-row-value">${esc(order.direccion)}${buildMapsBtn(order.direccion)}</span>
    </div>` : "";

  /* ── Sección de pago ── */
  const pagoMap = {
    efectivo:      { icon: "💵", label: "Efectivo" },
    transferencia: { icon: "📲", label: "Transferencia" },
    tarjeta:       { icon: "💳", label: "Tarjeta" },
    nequi:         { icon: "🟣", label: "Nequi" },
    daviplata:     { icon: "🔴", label: "Daviplata" }
  };
  const pagoInfo = order.tipoPago ? (pagoMap[order.tipoPago] || { icon: "💰", label: order.tipoPago }) : null;

  const cambio = (order.monto != null && order.total != null)
    ? order.monto - order.total : null;

  const pagoSection = `
    <div class="modal-section">
      <div class="modal-section-label">Pago</div>
      ${pagoInfo ? `
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span class="modal-row-label">Tipo de pago</span>
        <span class="modal-row-value">${pagoInfo.icon} ${pagoInfo.label}</span>
      </div>` : ""}
      ${order.total != null ? `
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <span class="modal-row-label">Total</span>
        <span class="modal-row-value" style="font-weight:600">${formatCOP(order.total)}</span>
      </div>` : ""}
      ${order.monto != null ? `
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <span class="modal-row-label">Monto recibido</span>
        <span class="modal-row-value">${formatCOP(order.monto)}</span>
      </div>` : ""}
      ${cambio != null ? `
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
        <span class="modal-row-label">Cambio</span>
        <span class="modal-row-value ${cambio < 0 ? 'text-danger' : ''}">${cambio < 0 ? "⚠ Falta " + formatCOP(Math.abs(cambio)) : formatCOP(cambio)}</span>
      </div>` : ""}
    </div>`;

  return `
    <div class="modal-section">
      <div class="modal-section-label">Pedido</div>
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="modal-row-label">Hora</span>
        <span class="modal-row-value">${hora}</span>
      </div>
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17H5a2 2 0 00-2 2"/><path d="M12 17h7a2 2 0 012 2"/><rect x="5" y="2" width="14" height="13" rx="2"/></svg>
        <span class="modal-row-label">Tipo</span>
        <span class="modal-row-value">${buildTipoBadge(order.tipo)}</span>
      </div>
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <span class="modal-row-label">Origen</span>
        <span class="modal-row-value">${origenInfo.icon} ${origenInfo.label}</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Cliente</div>
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="modal-row-label">Nombre</span>
        <span class="modal-row-value">${esc(order.nombreCliente)}</span>
      </div>
      <div class="modal-row">
        <svg class="modal-row-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.21 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.13 1.07.37 2.12.72 3.14a2 2 0 01-.45 2.11L6.91 8.37A16 16 0 0015.63 17.1l1.5-1.5a2 2 0 012.11-.45c1.02.35 2.07.59 3.14.72A2 2 0 0122 16.92z"/></svg>
        <span class="modal-row-label">Teléfono</span>
        <span class="modal-row-value">${esc(order.telefono)}</span>
      </div>
      ${direccionRow}
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Detalle del pedido</div>
      <div style="font-size:14px;line-height:1.65;padding:4px 0;color:var(--text-primary)">${esc(order.pedido)}</div>
      ${order.observaciones ? `<div class="order-obs" style="margin-top:8px;display:block">⚠ ${esc(order.observaciones)}</div>` : ""}
    </div>

    ${pagoSection}

    <div class="modal-section">
      <div class="modal-section-label">Comprobante de pago</div>
      ${proofHtml}
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Cambiar estado</div>
      <div class="modal-status-row">
        <span class="modal-status-label">Estado actual:</span>
        <div class="modal-status-btns">${statusBtns}</div>
      </div>
    </div>`;
}

function isModalOpen(id) {
  return currentModalId === id && document.getElementById("modal-overlay").classList.contains("open");
}
function refreshModal(order) {
  document.getElementById("modal-body").innerHTML = buildModalBody(order);
  document.querySelectorAll(".modal-status-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("modal-overlay").classList.remove("open");
      currentModalId = null;
      changeStatus(order.id, btn.dataset.estado);
    });
  });
}

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("modal-overlay").classList.remove("open");
  currentModalId = null;
});
document.getElementById("modal-overlay").addEventListener("click", e => {
  if (e.target.id === "modal-overlay") {
    document.getElementById("modal-overlay").classList.remove("open");
    currentModalId = null;
  }
});

/* ══════════════════════════════════════════
   MODAL NUEVO PEDIDO MANUAL
══════════════════════════════════════════ */
let newTipo          = "";
let pendingImageFile = null;   // File seleccionado, aún no subido
let uploadedImageUrl = "";     // URL definitiva en Storage (se rellena al guardar)

function openNewModal() {
  newTipo          = "";
  pendingImageFile = null;
  uploadedImageUrl = "";

  document.getElementById("new-tipo").value        = "";
  document.getElementById("new-nombre").value      = "";
  document.getElementById("new-telefono").value    = "";
  document.getElementById("new-direccion").value   = "";
  document.getElementById("new-pedido").value      = "";
  document.getElementById("new-obs").value         = "";
  document.getElementById("new-tipoPago").value    = "";
  document.getElementById("new-monto").value       = "";
  document.getElementById("new-total").value       = "";
  document.getElementById("new-comprobante").value = "";

  document.querySelectorAll(".tipo-opt").forEach(b => b.className = "tipo-opt");
  document.getElementById("new-direccion-group").classList.add("hidden");
  document.getElementById("new-modal-submit").disabled = true;

  // Reset upload UI
  setUploadState("idle");

  document.getElementById("new-modal-overlay").classList.add("open");
}

function closeNewModal() {
  document.getElementById("new-modal-overlay").classList.remove("open");
}

/** Controla qué panel de la zona de upload se muestra */
function setUploadState(state, progress) {
  const placeholder = document.getElementById("upload-placeholder");
  const preview     = document.getElementById("upload-preview");
  const progBar     = document.getElementById("upload-progress");

  placeholder.style.display = state === "idle"     ? "flex"   : "none";
  preview.style.display     = state === "preview"  ? "block"  : "none";
  progBar.style.display     = state === "uploading"? "flex"   : "none";

  if (state === "uploading" && progress != null) {
    document.getElementById("upload-progress-bar").style.width   = `${progress}%`;
    document.getElementById("upload-progress-label").textContent = `Subiendo… ${Math.round(progress)}%`;
  }
}

/* ── Click en zona de upload → abre file picker ── */
document.getElementById("upload-area").addEventListener("click", e => {
  if (e.target.id === "upload-remove") return;   // manejado abajo
  if (pendingImageFile) return;                  // ya hay imagen seleccionada
  document.getElementById("new-comprobante").click();
});

/* ── Archivo seleccionado ── */
document.getElementById("new-comprobante").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast("La imagen supera los 5 MB");
    e.target.value = "";
    return;
  }

  pendingImageFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById("upload-preview-img").src = ev.target.result;
    setUploadState("preview");
  };
  reader.readAsDataURL(file);
});

/* ── Quitar imagen seleccionada ── */
document.getElementById("upload-remove").addEventListener("click", e => {
  e.stopPropagation();
  pendingImageFile = null;
  uploadedImageUrl = "";
  document.getElementById("new-comprobante").value = "";
  document.getElementById("upload-preview-img").src = "";
  setUploadState("idle");
});

/**
 * Sube la imagen a Firebase Storage y devuelve la URL pública.
 * Muestra barra de progreso mientras sube.
 */
function uploadComprobante(file, pedidoNum) {
  return new Promise((resolve, reject) => {
    if (!storage) { resolve(""); return; }

    const ext  = file.name.split(".").pop() || "jpg";
    const path = `comprobantes/${pedidoNum}_${Date.now()}.${ext}`;
    const ref  = storage.ref(path);
    const task = ref.put(file);

    setUploadState("uploading", 0);

    task.on("state_changed",
      snap => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        setUploadState("uploading", pct);
      },
      err => reject(err),
      async () => {
        const url = await task.snapshot.ref.getDownloadURL();
        resolve(url);
      }
    );
  });
}

// Tipo de pedido — selector
document.querySelectorAll(".tipo-opt").forEach(btn => {
  btn.addEventListener("click", () => {
    newTipo = btn.dataset.tipo;
    document.getElementById("new-tipo").value = newTipo;
    document.querySelectorAll(".tipo-opt").forEach(b => b.className = "tipo-opt");
    btn.className = `tipo-opt selected-${newTipo}`;
    const dirGroup = document.getElementById("new-direccion-group");
    if (newTipo === "domicilio") {
      dirGroup.classList.remove("hidden");
    } else {
      dirGroup.classList.add("hidden");
      document.getElementById("new-direccion").value = "";
    }
    validateNewForm();
  });
});

// Validación en tiempo real
["new-nombre", "new-pedido", "new-direccion"].forEach(id => {
  document.getElementById(id).addEventListener("input", validateNewForm);
});

function validateNewForm() {
  const nombre = document.getElementById("new-nombre").value.trim();
  const pedido = document.getElementById("new-pedido").value.trim();
  const dir    = document.getElementById("new-direccion").value.trim();
  const ok = newTipo !== "" && nombre !== "" && pedido !== "" &&
             (newTipo !== "domicilio" || dir !== "");
  document.getElementById("new-modal-submit").disabled = !ok;
}

document.getElementById("btn-new-order").addEventListener("click", openNewModal);
document.getElementById("new-modal-close").addEventListener("click", closeNewModal);
document.getElementById("new-modal-cancel").addEventListener("click", closeNewModal);
document.getElementById("new-modal-overlay").addEventListener("click", e => {
  if (e.target.id === "new-modal-overlay") closeNewModal();
});

document.getElementById("new-modal-submit").addEventListener("click", async () => {
  const btn = document.getElementById("new-modal-submit");
  btn.disabled = true;
  btn.textContent = "Guardando…";

  const nombre   = document.getElementById("new-nombre").value.trim();
  const telefono = document.getElementById("new-telefono").value.trim();
  const dir      = document.getElementById("new-direccion").value.trim();
  const pedido   = document.getElementById("new-pedido").value.trim();
  const obs      = document.getElementById("new-obs").value.trim();
  const tipoPago = document.getElementById("new-tipoPago").value;
  const montoRaw = document.getElementById("new-monto").value;
  const totalRaw = document.getElementById("new-total").value;

  const monto = montoRaw !== "" ? parseInt(montoRaw, 10) : null;
  const total = totalRaw !== "" ? parseInt(totalRaw, 10) : null;

  const newNum = String(allOrders.length + 1).padStart(3, "0");

  // ── Subir imagen si hay una pendiente ──
  let comprobanteUrl = "";
  if (pendingImageFile) {
    try {
      btn.textContent = "Subiendo imagen…";
      comprobanteUrl = await uploadComprobante(pendingImageFile, newNum);
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      showToast("Error al subir la imagen — pedido sin comprobante");
      comprobanteUrl = "";
    }
  }

  const newOrder = {
    num:           newNum,
    nombreCliente: nombre,
    telefono:      telefono,
    direccion:     dir,
    pedido:        pedido,
    observaciones: obs,
    fecha:         new Date(),
    estado:        "Pendiente",
    tipo:          newTipo,
    origen:        "manual",
    comprobante:   comprobanteUrl,
    tipoPago:      tipoPago,
    monto:         monto,
    total:         total
  };

  // Modo demo
  if (!db || allOrders.some(o => o.id.startsWith("demo-"))) {
    newOrder.id = `demo-${Date.now()}`;
    allOrders.unshift(newOrder);
    renderAll();
    closeNewModal();
    showToast(`Pedido #${newNum} creado`);
    return;
  }

  try {
    btn.textContent = "Guardando…";
    const firestoreDoc = {
      num:           newOrder.num,
      nombreCliente: newOrder.nombreCliente,
      telefono:      newOrder.telefono,
      direccion:     newOrder.direccion,
      pedido:        newOrder.pedido,
      observaciones: newOrder.observaciones,
      fecha:         firebase.firestore.Timestamp.fromDate(newOrder.fecha),
      estado:        newOrder.estado,
      tipo:          newOrder.tipo,
      origen:        newOrder.origen,
      comprobante:   comprobanteUrl,
      tipoPago:      newOrder.tipoPago
    };
    if (monto !== null) firestoreDoc.monto = monto;
    if (total !== null) firestoreDoc.total = total;

    await db.collection("pedidos").add(firestoreDoc);
    closeNewModal();
    showToast(`Pedido #${newNum} creado`);
  } catch (err) {
    showToast("Error al guardar");
    btn.disabled = false;
    btn.textContent = "Crear pedido";
  }
});

/* ─── COMPROBANTES ─── */
function renderProofGrid() {
  const grid  = document.getElementById("proof-grid");
  const count = document.getElementById("proof-count");
  const list  = allOrders.filter(o => o.tipo === "domicilio" && o.comprobante?.trim());
  count.textContent = `${list.length} comprobante${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <p>Sin comprobantes de domicilio para este día</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(o => `
    <div class="proof-card" data-url="${esc(o.comprobante)}" data-caption="Comprobante — ${esc(o.nombreCliente)}">
      <div class="proof-img-wrap">
        <img src="${esc(o.comprobante)}" alt="Comprobante" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=proof-img-placeholder style=padding:30px><svg width=32 height=32 viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><rect x=3 y=3 width=18 height=18 rx=2/><circle cx=8.5 cy=8.5 r=1.5/><polyline points=21,15,16,10,5,21/></svg></div>'"
        />
      </div>
      <div class="proof-card-body">
        <div class="proof-card-name">${esc(o.nombreCliente)}</div>
        <div class="proof-card-meta">${buildTipoBadge(o.tipo)}</div>
        ${o.tipoPago ? `<div class="proof-card-meta">${buildPagoBadge(o.tipoPago)}</div>` : ""}
        ${o.total != null ? `<div class="proof-card-meta" style="font-weight:600;color:var(--text-primary)">${formatCOP(o.total)}</div>` : ""}
        <div class="proof-card-meta" style="margin-top:4px">${formatTime(o.fecha)}</div>
        <div class="proof-card-num">#${o.num}</div>
      </div>
    </div>`).join("");

  grid.querySelectorAll(".proof-card").forEach(card => {
    card.addEventListener("click", () =>
      openLightbox(card.dataset.url, card.dataset.caption));
  });
}

/* ─── LIGHTBOX ─── */
function openLightbox(url, caption) {
  document.getElementById("lightbox-img").src = url;
  document.getElementById("lightbox-caption").textContent = caption || "";
  document.getElementById("lightbox").classList.add("open");
}

document.getElementById("lightbox-close").addEventListener("click", () =>
  document.getElementById("lightbox").classList.remove("open"));
document.getElementById("lightbox").addEventListener("click", e => {
  if (["lightbox", "lightbox-img"].includes(e.target.id))
    document.getElementById("lightbox").classList.remove("open");
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.getElementById("lightbox").classList.remove("open");
    document.getElementById("modal-overlay").classList.remove("open");
    document.getElementById("new-modal-overlay").classList.remove("open");
    currentModalId = null;
  }
});

/* ─── FILTROS ─── */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterMode = btn.dataset.filter;
    renderOrders();
  });
});

/* ─── NAVEGACIÓN SECCIONES ─── */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`section-${btn.dataset.section}`).classList.add("active");
    if (btn.dataset.section === "disponibilidad" && db) loadDisponibilidad();
  });
});

/* ─── UTILIDADES ─── */
function nextEstado(estado) {
  return { "Pendiente": "En preparación", "En preparación": "En camino", "En camino": "Entregado", "Entregado": null }[estado] ?? null;
}
function estadoToClass(estado) {
  return { "Pendiente": "pendiente", "En preparación": "preparacion", "En camino": "camino", "Entregado": "entregado" }[estado] || "pendiente";
}
function formatTime(date) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1)  return "Ahora mismo";
  if (diff < 60) return `Hace ${diff} min`;
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function formatCOP(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
  }).format(amount);
}
function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function hideLoading() { document.getElementById("loading-state")?.remove(); }

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ─── DISPONIBILIDAD ─── */
function loadDisponibilidad() {
  const displayNames = {
    "familiar":              "Picada Familiar",
    "papas":                 "Adición de Papas",
    "canon":                 "Cañón",
    "familiar grande":       "Picada Familiar Grande",
    "familiar grande mixta": "Picada Familiar Grande Mixta",
    "medio canon":           "Media de Cañón",
    "pequena":               "Picada Pequeña"
  };

  db.collection("config").doc("disponibilidad")
    .onSnapshot(snap => {
      const data = snap.data() || {};
      const items = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
      const grid = document.getElementById("disp-grid");
      document.getElementById("disp-count").textContent =
        `${items.filter(([,v]) => v).length} / ${items.length} disponibles`;

      grid.innerHTML = items.map(([nombre, disponible]) => {
        const label = displayNames[nombre] || nombre.charAt(0).toUpperCase() + nombre.slice(1);
        return `
          <div class="disp-item ${disponible ? "disponible" : "agotado"}"
               data-key="${esc(nombre)}">
            <span class="disp-item-name">${esc(label)}</span>
            <button class="disp-toggle" title="${disponible ? "Marcar agotado" : "Marcar disponible"}"></button>
          </div>`;
      }).join("");

      grid.querySelectorAll(".disp-item").forEach(el => {
        el.addEventListener("click", () => {
          const key = el.dataset.key;
          const current = el.classList.contains("disponible");
          db.collection("config").doc("disponibilidad")
            .update({ [key]: !current })
            .catch(() => showToast("Error al actualizar"));
        });
      });
    });
}
/* ─── ARRANQUE ─── */
updateDateLabel();
initFirebase();