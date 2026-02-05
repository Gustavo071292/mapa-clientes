const XLSX = require("xlsx");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const EXCEL_PATH = "./maps.xlsx";
const PLANTILLA_PATH = "./plantilla.v2.json";

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "clientesDB";
const COLLECTION = "clientes";

const BATCH_SIZE = 1000;

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeCode(v) {
  // Si viene como número, evita 1.0 / notación rara
  const s = toStr(v);
  return s;
}

function loadPlantilla() {
  if (!fs.existsSync(PLANTILLA_PATH)) throw new Error(`No existe ${PLANTILLA_PATH}`);
  return JSON.parse(fs.readFileSync(PLANTILLA_PATH, "utf8"));
}

function validateHeaders(rows, plantilla) {
  const headers = rows.length
    ? Object.keys(rows[0]).map((h) => h.trim())
    : [];

  // Normalizamos para comparar sin errores por mayúsculas/espacios
  const headersNorm = headers.map((h) => h.toLowerCase());
  const headerSet = new Set(headersNorm);

  const missing = (plantilla.required || []).filter(
    (h) => !headerSet.has(String(h).trim().toLowerCase())
  );

  if (missing.length) {
    throw new Error(`Faltan encabezados obligatorios: ${missing.join(", ")}`);
  }

  return headers; // devolvemos headers reales por si los quieres usar después
}


async function ensureIndexes(col) {
  // Evitar el problema que tuviste: índice ya existe con otra config
  const indexes = await col.indexes();
  const codigoIndex = indexes.find((i) => i.name === "codigo_1");

  if (codigoIndex) {
    const isUnique = !!codigoIndex.unique;
    if (!isUnique) {
      // lo borramos y lo recreamos como unique
      await col.dropIndex("codigo_1");
    }
  }

  await col.createIndex({ codigo: 1 }, { unique: true, name: "codigo_1" });
  await col.createIndex({ barrio: 1 }, { name: "barrio_1" });
  await col.createIndex({ telefono: 1 }, { name: "telefono_1" });
}

async function run() {
  const plantilla = loadPlantilla();

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No encontré el Excel en: ${EXCEL_PATH}`);
  }

  // Leer Excel
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  console.log("📄 Archivo:", EXCEL_PATH);
  console.log("📑 Hoja:", sheetName);
  console.log("📦 Filas leídas:", rows.length);

  // Validar encabezados
  validateHeaders(rows, plantilla);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("✅ Conectado a MongoDB");

  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  await ensureIndexes(col);

  let ops = [];
  let processed = 0;
  let skipped = 0;

  for (const r of rows) {
    const codigo = normalizeCode(r[plantilla.mapping.codigo]);
    const nombre = toStr(r[plantilla.mapping.nombre]);
    const lat = toNum(r[plantilla.mapping.lat]);
    const lng = toNum(r[plantilla.mapping.lng]);

    const telefono = toStr(r[plantilla.mapping.telefono]);
    const barrio = toStr(r[plantilla.mapping.barrio]);

    // Obligatorios
    if (!codigo || !nombre || lat === null || lng === null) {
      skipped++;
      continue;
    }

    // Extras
    const extras = {};
    for (const k of (plantilla.extras || [])) {
      extras[k] = toStr(r[k]);
    }

    const doc = {
      codigo,
      nombre,
      lat,
      lng,
      telefono,
      barrio,
      extras,
      source: {
        plantilla: plantilla.version || "v1",
        archivo: EXCEL_PATH,
        importadoEn: new Date()
      },
      updatedAt: new Date()
    };

    ops.push({
      updateOne: {
        filter: { codigo },
        update: { $set: doc, $setOnInsert: { createdAt: new Date() } },
        upsert: true
      }
    });

    if (ops.length >= BATCH_SIZE) {
      await col.bulkWrite(ops, { ordered: false });
      processed += ops.length;
      ops = [];
      console.log(`✅ Procesadas (aprox) ${processed} filas...`);
    }
  }

  if (ops.length) {
    await col.bulkWrite(ops, { ordered: false });
    processed += ops.length;
  }

  const total = await col.countDocuments();
  console.log("🎉 Importación terminada");
  console.log("✅ Operaciones (upsert/update) ejecutadas:", processed);
  console.log("⚠️ Filas omitidas (faltó código/nombre/coords):", skipped);
  console.log("📊 Total documentos en colección:", total);

  await client.close();
}

run().catch((e) => {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
});
