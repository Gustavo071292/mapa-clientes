// ======================
// MAPA (Leaflet)
// ======================
const map = L.map("map").setView([3.4516, -76.5320], 12); // Cali por defecto

// Estilo de mapa oscuro
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

// Marcadores actuales en el mapa (para poder limpiar)
let markers = [];

// ======================
// UTILIDADES
// ======================
function setEstado(texto, ok = null) {
  const estado = document.getElementById("estado");
  if (!estado) return;

  if (ok === true) estado.innerHTML = `${texto} ✅`;
  else if (ok === false) estado.innerHTML = `${texto} ❌`;
  else estado.textContent = texto;
}

function limpiarMarcadores() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
}

function parseClientes(texto) {
  return String(texto || "")
    .split(/[\n,; \t\r]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function getCD() {
  const el = document.getElementById("cd");
  return el ? String(el.value || "").trim() : "";
}

function val(x) {
  if (x === null || x === undefined) return "—";
  const s = String(x).trim();
  return s === "" ? "—" : s;
}

// ======================
// RESALTADO DINÁMICO (Colores)
// ======================

// Resalta el método de pago (Cashless en Amarillo)
function decorateCobro(raw) {
  const s = val(raw);
  if (s === "—") return s;

  const isNo = /NO\s*ES\s*CASHLESS/i.test(s);
  const isCashless = /CASHLESS/i.test(s);

  if (isCashless && !isNo) {
    return `<span class="hl hl-yellow">${s}</span>`;
  }
  return s;
}

// Resalta el estado del NPS
function decorateNPS(raw) {
  const s = val(raw);
  if (s === "—") return s;

  if (/^SIN\s+ENCUESTA\b/i.test(s)) return s;

  const low = s.toLowerCase();
  if (low.includes("detractor")) return `<span class="hl hl-red">${s}</span>`;
  if (low.includes("neutro")) return `<span class="hl hl-yellow">${s}</span>`;
  if (low.includes("promotor")) return `<span class="hl hl-green">${s}</span>`;

  return s;
}

// Resalta Cerveza, NABS y MKP por volumen
function decorateVolumen(raw) {
  const s = val(raw);
  if (s === "—") return s;

  const low = s.toLowerCase();
  // Azul para volúmenes grandes
  if (low.includes("grande") || low.includes("120 o mas")) {
    return `<span class="hl hl-blue">${s}</span>`;
  }
  // Naranja para volúmenes pequeños
  if (low.includes("pequeño")) {
    return `<span class="hl hl-orange">${s}</span>`;
  }
  return s;
}

// ====== FORMATEO MONEDA (COP) ======
function toNumberSmart(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === "number") return Number.isFinite(x) ? x : null;

  const s = String(x).trim();
  if (!s) return null;

  let cleaned = s.replace(/[^\d.,-]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const moneyCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function money(x) {
  const n = toNumberSmart(x);
  return n === null ? "—" : moneyCOP.format(n);
}

// ======================
// CONSTRUCCIÓN DEL POPUP
// ======================
function buildPopup(d) {
  const line = `<div style="border-top:1px dashed rgba(255,255,255,0.2); margin:8px 0;"></div>`;
  let html = `<div style="min-width:260px; color:white; font-family:sans-serif; line-height:1.4;">`;

  // Encabezado
  html += `<b>Cliente:</b> ${val(d.Cliente)}<br/>`;
  html += `<b>Nombre:</b> ${val(d.Nombre)}<br/>`;
  html += `<b>Propietario:</b> ${val(d.Propietario)}<br/>`;
  html += `<b>Teléfono:</b> ${val(d.Telefono)}<br/>`;
  html += `<b>Cobro:</b> ${decorateCobro(d.Cobro)}<br/>`;
  html += `<b>NPS:</b> ${decorateNPS(d.NPS)}<br/>`;

  html += line;

  // Logística
  html += `<b>Día de entrega:</b> ${val(d.EntregaFREE)}<br/>`;
  html += `<b>Día Flex:</b> ${val(d.DiaFlex)}<br/>`;
  html += `<b>Pedido mínimo:</b> ${money(d.ValorMinimoFlex)}<br/>`;
  html += `<b>Valor Flex:</b> ${money(d.ValorFlex)}<br/>`;
  html += `<b>ETA:</b> ${val(d.ETA)}<br/>`; 

  html += line;

  // Ubicación
  html += `<b>Zona Venta:</b> ${val(d.ZonaVenta)}<br/>`;
  html += `<b>COM:</b> ${val(d.COM)}<br/>`;
  html += `<b>Distrito:</b> ${val(d.Distrito)}<br/>`;
  html += `<b>Barrio:</b> ${val(d.Barrio)}<br/>`;
  html += `<b>Calle:</b> ${val(d.Direccion)}<br/>`; 

  html += `<br/>`; 

  // Portafolio y Volúmenes (Resaltados)
  html += `<b>Cerveza:</b> ${decorateVolumen(d.Cerveza)}<br/>`;
  html += `<b>NABS:</b> ${decorateVolumen(d.NABS)}<br/>`;
  html += `<b>MKP:</b> ${decorateVolumen(d.MKP)}<br/>`;

  html += `</div>`;
  return html;
}

// ======================
// FUNCIONES DE MAPA
// ======================
function normalizarCliente(d) {
  if (!d || typeof d !== "object") return null;
  const lat = typeof d.lat === "number" ? d.lat : null;
  const lng = typeof d.lng === "number" ? d.lng : null;
  return {
    ...d,
    Cliente: d.Cliente ?? d.cliente ?? "-",
    Nombre: d.Nombre ?? d.nombre ?? "Sin nombre",
    lat, lng,
  };
}

function pintarClientes(lista) {
  const clientes = (lista || []).map(normalizarCliente).filter(Boolean);

  clientes.forEach((c) => {
    if (typeof c.lat !== "number" || typeof c.lng !== "number") return;
    const marker = L.marker([c.lat, c.lng]).addTo(map).bindPopup(buildPopup(c));
    markers.push(marker);
  });

  if (markers.length > 0) {
    const grupo = L.featureGroup(markers);
    map.fitBounds(grupo.getBounds(), { padding: [30, 30] });
  }
}

// ======================
// CARGA DE DATOS Y EVENTOS
// ======================
async function cargarCDs() {
  const sel = document.getElementById("cd");
  if (!sel) return;

  try {
    const res = await fetch("/api/cds");
    const json = await res.json();
    const cds = json.data || [];

    sel.innerHTML = `<option value="">Selecciona CD...</option>`;
    cds.forEach(({ code, name }) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `${name} (${code})`;
      sel.appendChild(opt);
    });

    const preferido = "AV46";
    if (cds.some((x) => x.code === preferido)) sel.value = preferido;
  } catch (e) {
    console.warn("No se pudo cargar /api/cds", e);
  }
}

cargarCDs();

// Búsqueda Individual
document.getElementById("buscar")?.addEventListener("click", async () => {
  const cd = getCD();
  const cliente = document.getElementById("codigo")?.value.trim();

  if (!cd || !cliente) {
    setEstado("CD y Cliente requeridos", false);
    return;
  }

  setEstado("Buscando...", null);

  try {
    const url = `/api/delivery/buscar?cd=${encodeURIComponent(cd)}&cliente=${encodeURIComponent(cliente)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      setEstado(data?.error ?? "No encontrado", false);
      return;
    }

    limpiarMarcadores();
    pintarClientes([data]);
    setEstado("Cliente encontrado", true);
    colapsarPanelEnMovil();
  } catch (e) {
    setEstado("Error consultando el servidor", false);
  }
});

// Búsqueda Masiva
async function buscarMasivo(clientes) {
  const cd = getCD();
  if (!cd) {
    setEstado("Selecciona un CD", false);
    return;
  }

  const unicos = Array.from(new Set((clientes || []).map((x) => String(x).trim()).filter(Boolean)));
  if (unicos.length === 0) return;

  setEstado(`Buscando ${unicos.length} clientes...`, null);

  try {
    const res = await fetch(`/api/delivery/por-clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cd, clientes: unicos }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    limpiarMarcadores();
    pintarClientes(data.clientes || []);
    setEstado(`Mostrados: ${(data.clientes || []).length}`, true);
    colapsarPanelEnMovil();
  } catch (e) {
    setEstado("Error en búsqueda masiva", false);
  }
}

// Eventos de botones de carga
document.getElementById("btnCargarArchivo")?.addEventListener("click", async () => {
  const input = document.getElementById("archivoCodigos");
  const file = input?.files?.[0];
  if (!file) return;
  const texto = await file.text();
  await buscarMasivo(parseClientes(texto));
});

document.getElementById("btnMostrarManual")?.addEventListener("click", async () => {
  const texto = document.getElementById("codigosManual")?.value || "";
  await buscarMasivo(parseClientes(texto));
});

document.getElementById("btnLimpiar")?.addEventListener("click", () => {
  limpiarMarcadores();
  setEstado("Marcadores limpiados", null);
});

// Panel Móvil
function colapsarPanelEnMovil() {
  const panel = document.getElementById("panel");
  const btn = document.getElementById("togglePanel");
  if (window.innerWidth <= 720 && panel && btn) {
    panel.classList.add("is-collapsed");
    btn.textContent = "Controles";
  }
}

(function initPanelMobile() {
  const panel = document.getElementById("panel");
  const btn = document.getElementById("togglePanel");
  if (panel && btn) {
    btn.addEventListener("click", () => {
      const collapsed = panel.classList.toggle("is-collapsed");
      btn.textContent = collapsed ? "Controles" : "Ocultar";
    });
  }
})();