const mongoose = require('mongoose');

/**
 * ESQUEMA DE DATOS: 5 PORQUÉS (GERENCIA VALLE)
 * Modelo Mongoose para análisis de causa raíz y trazabilidad de gestión.
 */

const gestionSchema = new mongoose.Schema({
    fecha: { type: Date, default: Date.now },
    estadoAnterior: { type: String },
    estadoNuevo: { type: String },
    comentario: { type: String },
    usuarioGestion: { type: String, default: 'Sistema/Gestor' }
});

const cincoPorquesSchema = new mongoose.Schema({
    // Campos de Identificación y Contexto
    cd: { type: String, required: true },
    transporte: { type: String, required: true },
    placa: { type: String, required: true },
    indicador: { type: String, required: true },
    descripcion_novedad: { type: String },

    // Metodología de los 5 Porqués
    p1: { type: String },
    p2: { type: String },
    p3: { type: String },
    p4: { type: String },
    p5: { type: String },
    causa_raiz: { type: String },

    // Plan de Acción
    plan_accion: { type: String },
    responsable: { type: String },
    fecha_compromiso: { type: Date },

    // Control de Estado
    estado: { 
        type: String, 
        enum: ['Pendiente', 'En Proceso', 'Realizado', 'Cerrado', 'No ejecutado'],
        default: 'Pendiente'
    },
    
    // Historial Acumulativo para Dashboard Ejecutivo 2.3
    historialGestion: [gestionSchema],

    // Campos de compatibilidad legacy
    comentarioGestion: { type: String },
    fechaGestion: { type: Date },

    fecha_creacion: { type: Date, default: Date.now }
}, {
    collection: 'cinco_porques',
    timestamps: true 
});

// Índices optimizados para auditoría y filtros de Dashboard
cincoPorquesSchema.index({ cd: 1, estado: 1 });
cincoPorquesSchema.index({ placa: 1 });

module.exports = mongoose.model('CincoPorques', cincoPorquesSchema);