const express = require("express");
const router = express.Router();
const Cliente = require("../models/Cliente");

// Helpers de limpieza de datos
const toStr = (v) => (v === null || v === undefined ? "" : String(v).trim());
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// GET /clientes/buscar?cd=...&cliente=...
router.get("/buscar", async (req, res) => {
  try {
    const cd = toStr(req.query.cd);
    const cliente = toStr(req.query.cliente);

    if (!cd || !cliente) return res.status(400).json({ error: "Faltan parámetros" });

    const doc = await Cliente.findOne({ CD: cd, Cliente: cliente }).lean();
    if (!doc) return res.status(404).json({ error: "Cliente no encontrado" });

    const lat = toNum(doc.Latitud);
    const lng = toNum(doc.Longitud);

    if (lat === null || lng === null) {
      return res.status(422).json({ error: "Cliente sin coordenadas", CD: doc.CD, Cliente: doc.Cliente });
    }

    res.json({ ...doc, lat, lng });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /clientes/por-clientes (Búsqueda Masiva)
router.post("/por-clientes", async (req, res) => {
  try {
    const cd = toStr(req.body.cd);
    const clientes = req.body.clientes;

    if (!cd || !Array.isArray(clientes)) return res.status(400).json({ error: "Datos inválidos" });

    const unicos = Array.from(new Set(clientes.map(toStr).filter(Boolean)));
    const encontrados = await Cliente.find({ CD: cd, Cliente: { $in: unicos } }).lean();

    const conCoordenadas = encontrados.map(d => ({
      ...d,
      lat: toNum(d.Latitud),
      lng: toNum(d.Longitud)
    })).filter(d => d.lat !== null && d.lng !== null);

    res.json({ cd, clientes: conCoordenadas, totalEncontrados: encontrados.length });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;