const express = require('express');
const router = express.Router();
const path = require('path');
const authController = require('../controllers/authController');

// 1.1 y 1.2: Rutas para mostrar las vistas de indicadores
router.get('/consolidado', (req, res) => {
    // Aquí cargaremos el HTML de resultados que haremos más adelante
    res.send('Vista de Consolidado en construcción');
});

router.get('/detalle', (req, res) => {
    res.send('Vista de Detalle por Persona en construcción');
});

// 1.3: Ruta para la vista de Rendimiento Variable (Sección Protegida)
router.get('/variable', (req, res) => {
    // Esta ruta mostrará la pantalla donde se pide la contraseña
    res.send('Pantalla de ingreso de contraseña para Variables');
});

// Ruta POST para procesar la contraseña usando el controlador que ya creaste
router.post('/variable/login', authController.verificarAccesoVariable);

module.exports = router;