const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const iaController = require('../controllers/iaController');

// 1. Rutas de Reportes (Lo que ya te funcionaba)
router.post('/guardar-novedad', reporteController.guardarNovedad);
router.post('/guardar-5porques', reporteController.guardarAnalisisDPO);
router.post('/gestionar-reporte', reporteController.actualizarEstadoReporte);

// 2. Ruta de IA (Debe decir 'generarSugerencia' como en tu foto)
router.post('/ia-sugerencia', iaController.generarSugerencia); 

// 3. Ruta de Datos
router.get('/consolidado-valle', reporteController.obtenerConsolidadoValle);

module.exports = router;