/**
 * MODELO: KpiConfig.js
 * Ruta: models/KpiConfig.js
 * Descripción: Modelo de datos Mongoose para la parametrización de metas y operadores de KPIs.
 */

const mongoose = require('mongoose');

const KpiConfigSchema = new mongoose.Schema({
    kpi_impactado: { 
        type: String, 
        required: true,
        uppercase: true 
    },
    indicador_pi: { 
        type: String, 
        required: true 
    },
    mongo_field: { 
        type: String, 
        required: true, 
        unique: true 
    },
    unidad: { 
        type: String, 
        required: true 
    },
    meta: { 
        type: Number, 
        required: true 
    },
    // Almacenamiento explícito del operador lógico para la Meta sin alterar lógica en frontend
    meta_operador: { 
        type: String, 
        required: true 
    },
    disparador: { 
        type: Number, 
        required: true 
    },
    // Almacenamiento explícito del operador lógico para el Disparador sin alterar lógica en frontend
    disparador_operador: { 
        type: String, 
        required: true 
    },
    direccion_logica: { 
        type: String, 
        required: true, 
        enum: ['MAYOR_ES_MEJOR', 'MENOR_ES_MEJOR'] 
    },
    display_format: { 
        type: String, 
        required: true, 
        enum: ['NUMBER', 'PERCENT', 'HH_MM'] 
    },
    aplicabilidad: [{ 
        type: String, 
        uppercase: true 
    }],
    herramienta_gestion: { 
        type: String, 
        default: "Gestión del Día Anterior" 
    }
}, { 
    timestamps: true,
    collection: 'kpiconfigs'
});

module.exports = mongoose.model('KpiConfig', KpiConfigSchema);