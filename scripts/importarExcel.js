// scripts/importarExcel.js
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { MongoClient } = require("mongodb");

const EXCEL_PATH = path.join(__dirname, "..", "data", "Clientes.xlsx");
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "mapa_clientes";
const COLLECTION = "clientes";

const BATCH_SIZE = 1000;

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;

  // Si viene como string con coma decimal, lo soportamos también
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);

  return Number.isFinite(n) ? n : null;
}

async function ensureIndexes(col) {
  await col.createIndex(
    { CD: 1, Cliente: 1 },
    { unique: true, name: "CD_Cliente_unique" }
  );
}

async function run() {
  if (!MONGO_URI) throw new Error("Falta MONGO_URI en .env");

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No encontré el archivo: ${EXCEL_PATH}`);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // defval: "" para que no se pierdan columnas vacías
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  console.log("📄 Excel:", EXCEL_PATH);
  console.log("📑 Hoja:", sheetName);
  console.log("📦 Filas leídas:", rows.length);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("✅ Conectado a MongoDB Atlas");

  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  await ensureIndexes(col);

  let ops = [];
  let processed = 0;
  let skipped = 0;

  for (const r of rows) {
    const CD = toStr(r["CD"]);
    const Cliente = toStr(r["Cliente"]);
    const Nombre = toStr(r["Nombre"]);

    const lat = toNum(r["Latitud"]);
    const lng = toNum(r["Longitud"]);

    // Obligatorios mínimos para el mapa
    if (!CD || !Cliente || lat === null || lng === null) {
      skipped++;
      continue;
    }

    const doc = {
      CD,
      Cliente,
      Nombre,

      Barrio: toStr(r["Barrio"]),
      ZT: toStr(r["ZT"]),
      Telefono: toStr(r["Telefono"]),

      Latitud: lat,
      Longitud: lng,

      COM: toStr(r["COM"]),
      ZonaVenta: toStr(r["ZonaVenta"]),
      Distrito: toStr(r["Distrito"]),
      EntregaFREE: toStr(r["EntregaFREE"]),
      DiaFlex: toStr(r["DiaFlex"]),
      ValorMinimoFlex: toStr(r["ValorMinimoFlex"]),
      ValorFlex: toStr(r["ValorFlex"]),
      Cerveza: toStr(r["Cerveza"]),
      NABS: toStr(r["NABS"]),
      MKP: toStr(r["MKP"]),
      Cobro: toStr(r["Cobro"]),
      NPS: toStr(r["NPS"]),

      updatedAt: new Date(),
      source: {
        archivo: path.basename(EXCEL_PATH),
        importadoEn: new Date(),
      },
    };

    ops.push({
      updateOne: {
        filter: { CD, Cliente },
        update: { $set: doc, $setOnInsert: { createdAt: new Date() } },
        upsert: true,
      },
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
  console.log("✅ Operaciones ejecutadas:", processed);
  console.log("⚠️ Filas omitidas:", skipped);
  console.log("📊 Total documentos en colección:", total);

  await client.close();
}

run().catch((e) => {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
});
