const XLSX = require("xlsx");
const fs = require("fs");

const EXCEL_PATH = "./maps.xlsx";
const PLANTILLA_PATH = "./plantilla.v1.json";

function exitWith(msg) {
  console.error(msg);
  process.exit(1);
}

function normalizeSet(arr) {
  return new Set(arr.map((x) => String(x).trim()));
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    exitWith(`❌ No encontré el archivo Excel en: ${EXCEL_PATH}`);
  }
  if (!fs.existsSync(PLANTILLA_PATH)) {
    exitWith(`❌ No encontré la plantilla en: ${PLANTILLA_PATH}`);
  }

  const plantilla = JSON.parse(fs.readFileSync(PLANTILLA_PATH, "utf8"));

  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  // Encabezados desde el primer row interpretado por sheet_to_json
  const headers = rows.length
  ? Object.keys(rows[0]).map((h) => h.trim().toLowerCase())
  : [];
  const headerSet = normalizeSet(headers);

  const missing = (plantilla.required || []).filter(
  (h) => !headerSet.has(h.toLowerCase())
);
  const extra = headers.filter((h) => !(plantilla.required || []).includes(h) && !(plantilla.extras || []).includes(h) && !Object.values(plantilla.mapping || {}).includes(h));

  console.log("📄 Archivo:", EXCEL_PATH);
  console.log("📑 Hoja:", sheetName);
  console.log("📦 Filas detectadas:", rows.length);
  console.log("🧾 Encabezados detectados:", headers);

  if (missing.length) {
    console.log("❌ FALTAN encabezados obligatorios:", missing);
    console.log("🛑 Validación FALLÓ. No se debe importar.");
    process.exit(1);
  }

  console.log("✅ Encabezados obligatorios OK:", plantilla.required);

  if (extra.length) {
    console.log("⚠️ Encabezados NO contemplados (se ignoran):", extra);
  } else {
    console.log("✅ No hay encabezados inesperados.");
  }

  console.log("✅ Validación OK. Puedes ejecutar: node importarExcel.js");
}

main();
