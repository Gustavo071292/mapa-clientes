const express = require('express');
const router = express.Router();

const rtaController = require('../controllers/rtaController');

// Rutas del módulo Gestión RTA
router.post('/guardar-rta', rtaController.guardarRTA);
router.get('/listar-rta', rtaController.listarRTA);
router.patch('/actualizar-estado/:id', rtaController.actualizarEstado);

module.exports = router;