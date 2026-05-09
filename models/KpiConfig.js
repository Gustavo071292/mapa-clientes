const mongoose = require('mongoose');

/**
 * Esquema de Configuración de KPIs (Data Maestra)
 * Define las reglas de negocio, metas y aplicabilidad por CD.
 */
const KpiConfigSchema = new mongoose.Schema({
    // Nombre tal cual aparece en los encabezados del Excel
    indicador_pi: { 
        type: String, 
        required: true, 
        unique: true 
    },
    // El KPI macro al que impacta (TRI, OTIF, NPS, INFULL, etc.)
    kpi_impactado: { 
        type: String, 
        required: true 
    },
    // Nombre de la propiedad técnica en el modelo DesempenoKpi
    mongo_field: { 
        type: String, 
        required: true 
    },
    // Formato de renderizado en el frontend
    display_format: { 
        type: String, 
        enum: ['NUMBER', 'PERCENT', 'HH_MM'], 
        default: 'NUMBER' 
    },
    // Unidad de medida para mostrar en la tabla (%, #, Min, Hora, Cajas)
    unidad: { 
        type: String, 
        required: true 
    },
    // Valor límite para el estado "success" (Verde)
    meta: { 
        type: Number, 
        required: true 
    },
    // Valor límite que activa el estado "triggered" (Azul)
    disparador: { 
        type: Number, 
        required: true 
    },
    // Define cómo se comparan los valores (Hacia arriba o hacia abajo)
    direccion_logica: { 
        type: String, 
        enum: ['MAYOR_ES_MEJOR', 'MENOR_ES_MEJOR'], 
        required: true 
    },
    // Lista de CDs donde este indicador es visible (CALI, POPAYAN, TULUA)
    aplicabilidad: [{ 
        type: String 
    }],
    // Nombre de la herramienta que se activará en el Módulo 2.2
    herramienta_gestion: { 
        type: String, 
        default: 'Gestión del Día Anterior' 
    }
}, { 
    timestamps: true // Para rastrear cuándo se actualizaron las metas
});

module.exports = mongoose.model('KpiConfig', KpiConfigSchema);