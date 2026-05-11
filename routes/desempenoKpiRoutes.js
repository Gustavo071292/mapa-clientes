const express = require('express');
const router = express.Router();
const controller = require('../controllers/desempenoKpiController');

// Rutas de consulta de desempeño
router.get('/consulta', controller.getDesempenoKpi);
router.get('/semanal', controller.getDesempenoKpiSemanal);
router.get('/config', controller.getKpiConfig);

module.exports = router;