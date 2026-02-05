// ======================
// MAPA (Leaflet)
// ======================
const map = L.map("map").setView([3.4516, -76.5320], 12); // Cali por defecto

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
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

// Parsea "clientes" desde texto: soporta líneas, comas, punto y coma, espacios
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

// ====== MONEDA (COP) ======
function toNumberSmart(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === "number") return Number.isFinite(x) ? x : null;

  const s = String(x).trim();
  if (!s) return null;

  // deja dígitos, coma, punto y signo
  let cleaned = s.replace(/[^\d.,-]/g, "");

  // Caso 1: trae coma y punto -> asumimos 1.234.567,89
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Caso 2: solo comas -> normalmente miles en datos de negocio
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

// Construye el popup EXACTO como lo pediste
// (NO muestra CD / Latitud / Longitud)
function buildPopup(d) {
  // Campos (operativo / valores / comercial)
  const OPERATIVOS = [
    ["Cliente", "Cliente"],
    ["Nombre", "Nombre"],
    ["Barrio", "Barrio"],
    ["Poblacion", "Población"],
    ["Telefono", "Teléfono"],
    ["EntregaFREE", "Día entrega"],
  ];

  const COMERCIALES = [
    ["ZonaVenta", "Zona Venta"],
    ["Distrito", "Distrito"],
    ["COM", "COM"],
    ["Cerveza", "Cerveza"],
    ["NABS", "NABS"],
    ["MKP", "MKP"],
  ];

  const line = `<div style="border-top:1px dashed #999;margin:8px 0;"></div>`;

  const renderSection = (pairs) => {
    let out = "";
    for (const [key, label] of pairs) {
      // Cliente siempre sale arriba aunque esté vacío
      if (key === "Cliente") {
        out += `<b>${label}:</b> ${val(d[key])}<br/>`;
        continue;
      }

      const v = d[key];
      if (v === null || v === undefined || String(v).trim() === "") continue;

      out += `<b>${label}:</b> ${val(v)}<br/>`;
    }
    return out;
  };

  let html = `<div style="min-width:260px">`;

  // Operativos arriba
  html += renderSection(OPERATIVOS);

  // separador
  html += line;

  // Valores (Día Flex / Pedido mínimo / Valor Flex)  ✅ en moneda
  // Día Flex
  if (d.DiaFlex !== null && d.DiaFlex !== undefined && String(d.DiaFlex).trim() !== "") {
    html += `<b>Día Flex:</b> ${val(d.DiaFlex)}<br/>`;
  }
  // Pedido mínimo
  if (d.ValorMinimoFlex !== null && d.ValorMinimoFlex !== undefined && String(d.ValorMinimoFlex).trim() !== "") {
    html += `<b>Pedido mínimo:</b> ${money(d.ValorMinimoFlex)}<br/>`;
  }
  // Valor Flex
  if (d.ValorFlex !== null && d.ValorFlex !== undefined && String(d.ValorFlex).trim() !== "") {
    html += `<b>Valor Flex:</b> ${money(d.ValorFlex)}<br/>`;
  }

  // separador
  html += line;

  // Comerciales abajo
  html += renderSection(COMERCIALES);

  html += `</div>`;
  return html;
}

// Normaliza para pintar (acepta respuesta vieja o nueva)
function normalizarCliente(d) {
  if (!d || typeof d !== "object") return null;

  const lat = typeof d.lat === "number" ? d.lat : null;
  const lng = typeof d.lng === "number" ? d.lng : null;

  // Si viniera "extras" (por compatibilidad vieja), lo mezclamos
  const extras = d.extras && typeof d.extras === "object" ? d.extras : {};

  return {
    // NO lo mostraremos, pero lo conservamos si te sirve luego
    CD: d.CD ?? d.cd ?? extras.CD ?? "-",

    Cliente: d.Cliente ?? d.codigo ?? d.cliente ?? extras.Cliente ?? "-",
    Nombre: d.Nombre ?? d.nombre ?? extras.Nombre ?? "Sin nombre",
    Barrio: d.Barrio ?? d.barrio ?? extras.Barrio ?? "-",
    Poblacion: d.Poblacion ?? d.poblacion ?? extras.Poblacion,
    Telefono: d.Telefono ?? d.telefono ?? extras.Telefono ?? "-",

    EntregaFREE: d.EntregaFREE ?? extras.EntregaFREE,
    DiaFlex: d.DiaFlex ?? extras.DiaFlex,
    ValorMinimoFlex: d.ValorMinimoFlex ?? extras.ValorMinimoFlex,
    ValorFlex: d.ValorFlex ?? extras.ValorFlex,

    ZonaVenta: d.ZonaVenta ?? extras.ZonaVenta,
    Distrito: d.Distrito ?? extras.Distrito,
    COM: d.COM ?? extras.COM,
    Cerveza: d.Cerveza ?? extras.Cerveza,
    NABS: d.NABS ?? extras.NABS,
    MKP: d.MKP ?? extras.MKP,

    lat,
    lng,
  };
}

// Dibuja una lista de clientes en el mapa
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
// Cargar CDs al iniciar (si existe /api/cds)
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
      opt.value = code; // AV28/AV46/AV57
      opt.textContent = `${name} (${code})`;
      sel.appendChild(opt);
    });

    // Default: Cali (AV46) si está
    const preferido = "AV46";
    if (cds.some((x) => x.code === preferido)) sel.value = preferido;
  } catch (e) {
    console.warn("No se pudo cargar /api/cds (no crítico).", e);
  }
}

cargarCDs();

// ======================
// 1) BÚSQUEDA INDIVIDUAL (CD + Cliente)
// GET /clientes/buscar?cd=...&cliente=...
// ======================
document.getElementById("buscar")?.addEventListener("click", async () => {
  const cd = getCD();
  const cliente = document.getElementById("codigo")?.value.trim();

  if (!cd) {
    setEstado("Selecciona un CD", false);
    return;
  }
  if (!cliente) {
    setEstado("Cliente requerido", false);
    return;
  }

  setEstado("Buscando...", null);

  try {
    const url = `/clientes/buscar?cd=${encodeURIComponent(cd)}&cliente=${encodeURIComponent(cliente)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      setEstado(data?.error ?? "No encontrado", false);
      return;
    }

    limpiarMarcadores();
    pintarClientes([data]);

    setEstado("Cliente encontrado", true);

    // En móvil: cerrar panel para ver el mapa
    colapsarPanelEnMovil();
  } catch (e) {
    console.error(e);
    setEstado("Error consultando el servidor", false);
  }
});

// ======================
// 2) BÚSQUEDA MASIVA (CD + lista de clientes)
// POST /clientes/por-clientes
// Body: { cd: "AV46", clientes: [...] }
// ======================
async function buscarMasivo(clientes) {
  const cd = getCD();

  if (!cd) {
    setEstado("Selecciona un CD", false);
    return;
  }

  const unicos = Array.from(
    new Set((clientes || []).map((x) => String(x).trim()).filter(Boolean))
  );

  if (unicos.length === 0) {
    setEstado("No hay clientes válidos", false);
    return;
  }

  const LIMITE = 2000;
  if (unicos.length > LIMITE) {
    setEstado(`Demasiados clientes (máximo ${LIMITE})`, false);
    return;
  }

  setEstado(`Buscando ${unicos.length} clientes en ${cd}...`, null);

  try {
    const res = await fetch(`/clientes/por-clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cd, clientes: unicos }),
    });

    const data = await res.json();

    if (!res.ok) {
      setEstado(data?.error ?? "Error en búsqueda masiva", false);
      return;
    }

    const lista = data.clientes || [];

    limpiarMarcadores();
    pintarClientes(lista);

    const noEncontrados = (data.noEncontrados || []).length;
    const sinCoordenadas = (data.sinCoordenadas || []).length;

    let msg = `Mostrados: ${lista.length}`;
    if (noEncontrados > 0) msg += ` | No encontrados: ${noEncontrados}`;
    if (sinCoordenadas > 0) msg += ` | Sin coordenadas: ${sinCoordenadas}`;

    setEstado(msg, true);

    // En móvil: cerrar panel para ver el mapa
    colapsarPanelEnMovil();
  } catch (e) {
    console.error(e);
    setEstado("Error consultando el servidor", false);
  }
}

// ======================
// 2A) CARGAR ARCHIVO (.txt / .csv)
// ======================
document.getElementById("btnCargarArchivo")?.addEventListener("click", async () => {
  const input = document.getElementById("archivoCodigos");
  const file = input?.files?.[0];

  if (!file) {
    setEstado("Selecciona un archivo .txt o .csv", false);
    return;
  }

  try {
    const texto = await file.text();
    const clientes = parseClientes(texto);
    await buscarMasivo(clientes);
  } catch (e) {
    console.error(e);
    setEstado("Error leyendo el archivo", false);
  }
});

// ======================
// 2B) PEGAR CLIENTES (manual)
// ======================
document.getElementById("btnMostrarManual")?.addEventListener("click", async () => {
  const texto = document.getElementById("codigosManual")?.value || "";
  const clientes = parseClientes(texto);
  await buscarMasivo(clientes);
});

// ======================
// LIMPIAR MAPA
// ======================
document.getElementById("btnLimpiar")?.addEventListener("click", () => {
  limpiarMarcadores();
  setEstado("Marcadores limpiados", null);
});

// ======================
// PANEL COLAPSABLE (móvil)
// ======================
function colapsarPanelEnMovil() {
  const panel = document.getElementById("panel");
  const btn = document.getElementById("togglePanel");
  if (!panel || !btn) return;

  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  if (!isMobile) return;

  panel.classList.add("is-collapsed");
  btn.setAttribute("aria-expanded", "false");
  btn.textContent = "Controles";
}

(function initPanelMobile() {
  const panel = document.getElementById("panel");
  const btn = document.getElementById("togglePanel");
  if (!panel || !btn) return;

  // En móvil arrancamos colapsado para dar espacio al mapa
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  if (isMobile) {
    panel.classList.add("is-collapsed");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Controles";
  } else {
    btn.textContent = "Controles";
  }

  btn.addEventListener("click", () => {
    const collapsed = panel.classList.toggle("is-collapsed");
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.textContent = collapsed ? "Controles" : "Ocultar";
  });
})();
