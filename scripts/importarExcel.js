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

/**
 * Convierte cualquier valor a String y limpia espacios.
 */
function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/**
 * Convierte valores a número, soportando comas decimales.
 */
function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Asegura que existan índices para búsquedas rápidas y evitar duplicados.
 */
async function ensureIndexes(col) {
  await col.createIndex(
    { CD: 1, Cliente: 1 },
    { unique: true, name: "CD_Cliente_unique" }
  );
}

async function run() {
  if (!MONGO_URI) throw new Error("Falta MONGO_URI en el archivo .env");

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No se encontró el archivo Excel en: ${EXCEL_PATH}`);
  }

  // Leer Excel
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Convertir a JSON con defval "" para no perder columnas vacías
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  console.log("📄 Archivo:", path.basename(EXCEL_PATH));
  console.log("📦 Filas detectadas:", rows.length);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("✅ Conexión exitosa a MongoDB Atlas");

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

    // Validación mínima: CD, Código de Cliente y Coordenadas son obligatorios para el mapa
    if (!CD || !Cliente || lat === null || lng === null) {
      skipped++;
      continue;
    }

    // Objeto con los datos del cliente mapeados desde el Excel
    const doc = {
      CD,
      Cliente,
      Nombre,
      
      // ✅ NUEVOS CAMPOS AGREGADOS
      Propietario: toStr(r["Propietario"]), 
      Direccion: toStr(r["Calle"]), // Este campo se muestra como "Calle" en el mapa
      ETA: toStr(r["ETA"]),

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

    // Operación de "Upsert": si existe actualiza, si no existe crea
    ops.push({
      updateOne: {
        filter: { CD, Cliente },
        update: { $set: doc, $setOnInsert: { createdAt: new Date() } },
        upsert: true,
      },
    });

    // Procesar en lotes (batch) para mayor eficiencia
    if (ops.length >= BATCH_SIZE) {
      await col.bulkWrite(ops, { ordered: false });
      processed += ops.length;
      ops = [];
      console.log(`⏳ Procesados ${processed} registros...`);
    }
  }

  // Procesar remanentes
  if (ops.length) {
    await col.bulkWrite(ops, { ordered: false });
    processed += ops.length;
  }

  const totalFinal = await col.countDocuments();

  console.log("-----------------------------------------");
  console.log("🎉 ¡IMPORTACIÓN FINALIZADA!");
  console.log(`✅ Registros procesados: ${processed}`);
  console.log(`⚠️ Filas omitidas (sin coord./ID): ${skipped}`);
  console.log(`📊 Total en base de datos: ${totalFinal}`);
  console.log("-----------------------------------------");

  await client.close();
}

run().catch((e) => {
  console.error("❌ Error durante la importación:", e.message || e);
  process.exit(1);
});