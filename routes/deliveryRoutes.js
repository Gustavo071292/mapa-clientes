const express = require("express");
const router = express.Router();
const path = require("path");
const Cliente = require("../models/Cliente");

const toNum = (v) => {
    if (!v) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
};

/**
 * ==========================================
 * 0. RUTA PRIORITARIA (EVITA EL "CANNOT GET")
 * ==========================================
 */
router.get("/equipos-empoderados/retro/cinco-porques", (req, res) => {
    const file = path.resolve(__dirname, '..', 'views', 'equipos-empoderados', 'retroalimentacion', 'cinco-porques.html');
    res.sendFile(file, (err) => {
        if (err) {
            console.error("❌ ARCHIVO NO ENCONTRADO EN:", file);
            res.status(404).send("Error: El archivo físico no existe en la carpeta retroalimentacion.");
        }
    });
});

/**
 * ==========================================
 * 1. NAVEGACIÓN BÁSICA
 * ==========================================
 */
router.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'ejecucion-entrega', 'index.html'));
});

router.get("/pre-ruta", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'ejecucion-entrega', 'pre-ruta', 'index.html'));
});

router.get("/en-ruta", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'ejecucion-entrega', 'en-ruta', 'index.html'));
});

router.get("/post-ruta", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'ejecucion-entrega', 'post-ruta', 'index.html'));
});

router.get("/dqi", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'ejecucion-entrega', 'deliveryQualityIndex', 'index.html'));
});

/**
 * ==========================================
 * 2. EQUIPOS EMPODERADOS (GERENCIA VALLE)
 * ==========================================
 */
router.get("/equipos-empoderados/retro/novedades", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'equipos-empoderados', 'retroalimentacion', 'novedades.html'));
});

router.get("/equipos-empoderados/retro/resumen-gerencial", (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'equipos-empoderados', 'retroalimentacion', 'resumen.html'));
});

/**
 * ==========================================
 * 3. API DATA
 * ==========================================
 */
router.get("/buscar", async (req, res) => {
    try {
        const { cd, cliente } = req.query;
        const doc = await Cliente.findOne({ CD: cd, Cliente: cliente }).lean();
        if (!doc) return res.status(404).json({ error: "No encontrado" });
        res.json({ ...doc, lat: toNum(doc.Latitud), lng: toNum(doc.Longitud) });
    } catch (err) { res.status(500).json({ error: "Error en servidor" }); }
});

router.post("/por-clientes", async (req, res) => {
    try {
        const { cd, clientes } = req.body;
        const encontrados = await Cliente.find({ CD: cd, Cliente: { $in: clientes } }).lean();
        const lista = encontrados.map(d => ({ ...d, lat: toNum(d.Latitud), lng: toNum(d.Longitud) })).filter(d => d.lat !== null);
        res.json({ clientes: lista });
    } catch (err) { res.status(500).json({ error: "Error masivo" }); }
});

module.exports = router;