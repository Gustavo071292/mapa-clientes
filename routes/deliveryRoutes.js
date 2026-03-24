const express = require("express");
const router = express.Router();
const path = require("path"); // Importante para las rutas de archivos
const Cliente = require("../models/Cliente");

// Función de utilidad para números
const toNum = (v) => {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// --- RUTAS DE NAVEGACIÓN (Vistas HTML) ---

// Esta ruta carga el menú principal (Procesos y Manuales)
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/ejecucion-entrega/index.html"));
});

// Rutas para los sub-procesos (asegúrate de que el archivo exista en la carpeta)
router.get("/pre-ruta", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/ejecucion-entrega/pre-ruta/index.html"));
});

router.get("/en-ruta", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/ejecucion-entrega/en-ruta/index.html"));
});

router.get("/post-ruta", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/ejecucion-entrega/post-ruta/index.html"));
});

router.get("/dqi", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/ejecucion-entrega/deliveryQualityIndex/index.html"));
});


// --- RUTAS DE API (Datos JSON) ---

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

// ÚNICO EXPORT AL FINAL
module.exports = router;