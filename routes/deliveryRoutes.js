const express = require("express");
const router = express.Router();
const Cliente = require("../models/Cliente");

const toNum = (v) => {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// GET /api/delivery/buscar
router.get("/buscar", async (req, res) => {
  try {
    const { cd, cliente } = req.query;
    const doc = await Cliente.findOne({ CD: cd, Cliente: cliente }).lean();
    if (!doc) return res.status(404).json({ error: "No encontrado" });

    res.json({ 
      ...doc, 
      lat: toNum(doc.Latitud), 
      lng: toNum(doc.Longitud) 
    });
  } catch (err) { res.status(500).json({ error: "Error en servidor" }); }
});

// POST /api/delivery/por-clientes
router.post("/por-clientes", async (req, res) => {
  try {
    const { cd, clientes } = req.body;
    const encontrados = await Cliente.find({ CD: cd, Cliente: { $in: clientes } }).lean();
    
    const lista = encontrados.map(d => ({ 
      ...d, 
      lat: toNum(d.Latitud), 
      lng: toNum(d.Longitud) 
    })).filter(d => d.lat !== null);

    res.json({ clientes: lista });
  } catch (err) { res.status(500).json({ error: "Error masivo" }); }
});

module.exports = router;