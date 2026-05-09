const express = require('express');
const router = express.Router();
const desempenoKpiController = require('../controllers/desempenoKpiController');

/**
 * Endpoints del Módulo 1.1 Desempeño PI y KPI
 */

// Consulta de resultados diarios cruzados con metas
router.get('/consulta', desempenoKpiController.getDesempenoKpi);

// Consulta de la matriz de configuración y metas
router.get('/config', desempenoKpiController.getKpiConfig);

module.exports = router;