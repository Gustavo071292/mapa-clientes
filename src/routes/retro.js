const express = require('express');
const router = express.Router();
const path = require('path');

// ====== IMPORTACIÓN DE CONTROLADORES ======
const iaController = require('../controllers/iaController');
const reporteController = require('../controllers/reporteController');

// ====== RUTAS DE VISUALIZACIÓN (VISTAS) ======

// 1. Cargar la página de la Herramienta 5 Porqués
router.get('/resumen', (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/equipos-empoderados/retroalimentacion/cinco-porques.html'));
});

// 2. Cargar la página de Novedades / Reporte de Ruta
router.get('/novedades', (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/equipos-empoderados/retroalimentacion/novedades.html'));
});

// ====== RUTAS DE API (LÓGICA) ======

// 3. Endpoint para obtener sugerencias de la IA Gemini
router.post('/ia-sugerencia', iaController.obtenerSugerenciasCincoPorques);

// 4. Endpoint para guardar el análisis final de 5 Porqués en Atlas
router.post('/guardar-dpo', reporteController.guardarAnalisisDPO);

// 5. NUEVO: Endpoint para el reporte de novedades / ruta
// Este debe ir antes del module.exports para que funcione
router.post('/guardar-novedad', reporteController.guardarNovedad);

// ====== EXPORTACIÓN DEL ROUTER ======
module.exports = router;

// Ruta para que el Dashboard chupe la data unificada
router.get('/consolidado-valle', reporteController.obtenerConsolidadoValle);

// Ruta para que tú cambies los estados
router.post('/gestionar-reporte', reporteController.actualizarEstadoReporte);
// Esta es la pieza que le falta al rompecabezas
router.get('/resumen-gerencial', (req, res) => {
    // Asegúrate de que la ruta al archivo HTML sea la correcta
    res.sendFile(path.join(__dirname, '../../views/equipos-empoderados/dashboard-ejecutivo.html'));
});