const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const iaController = require('../controllers/iaController');

/**
 * ==========================================
 * RUTAS DE API - GERENCIA VALLE
 * ==========================================
 */

// 1. GUARDAR NOVEDAD / ROTURA (Formulario 2.1)
router.post('/guardar-novedad', reporteController.guardarNovedad);

// 2. GUARDAR ANÁLISIS 5 PORQUÉS (Formulario 2.2)
router.post('/guardar-5porques', reporteController.guardarCincoPorques);

// 3. CONSULTA DE DATOS PARA DASHBOARD (Vista 2.3)
router.get('/consolidado-valle', reporteController.obtenerConsolidadoNovedades);

// 4. ASISTENCIA DE IA (Gemini)
router.post('/ia-sugerencia', iaController.generarSugerencia);

// 5. ACTUALIZAR ESTADO DE GESTIÓN (Botón "Guardar Cambios" del Dashboard)
// 🚨 ESTA ERA LA QUE FALTABA PARA QUE EL MODAL FUNCIONARA
router.post('/gestionar-reporte', reporteController.gestionarReporte);

/**
 * NOTA: 
 * La ruta '/gestionar-reporte' debe coincidir con el fetch que 
 * hacemos en 'dashboard-ejecutivo.js'.
 */

module.exports = router;