const express = require('express');
const router = express.Router();
const variableController = require('../controllers/variableController');

// Rutas de consulta para el módulo Variable
router.get('/meses/:identificador', variableController.getMesesDisponibles);
router.get('/resumen/:identificador', variableController.getResumenMensual);
router.get('/detalle/:identificador', variableController.getDetalleDiario);

module.exports = router;