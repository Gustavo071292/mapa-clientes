const express = require('express');
const router = express.Router();
const ejecucionController = require('../controllers/ejecucionController');

router.get('/kpis', ejecucionController.getKpis);
router.get('/historico', ejecucionController.getHistorico);

module.exports = router;