const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const iaController = require('../controllers/iaController'); // Lo dejamos por si lo usas en otro lado

// 1. Rutas de Novedades y Roturas (Basadas en tu nuevo reporteController.js)
router.post('/guardar-novedad', reporteController.guardarNovedad);

// 2. Ruta de Datos
router.get('/consolidado-valle', reporteController.obtenerConsolidadoNovedades);

// NOTA: Si no tienes 'guardarAnalisisDPO' o 'actualizarEstadoReporte' 
// en reporteController.js, NO las pongas aquí porque te darán el error de la foto.

// 3. Ruta de IA (Verifica que en iaController.js diga 'exports.generarSugerencia')
router.post('/ia-sugerencia', iaController.generarSugerencia); 

module.exports = router;