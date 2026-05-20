/**
 * MODELO: DesempenoKpi.js
 * Ruta: models/DesempenoKpi.js
 * Descripción: Modelo de datos Mongoose para el rendimiento de KPIs por viaje/ruta.
 * Mantiene compatibilidad total con índices quíntuples de la operación logística.
 */

const mongoose = require('mongoose');

const DesempenoKpiSchema = new mongoose.Schema({
    // Llaves primarias e identificadores de ruteo compuesto
    cd: { 
        type: String, 
        required: true, 
        uppercase: true,
        trim: true 
    },
    fecha: { 
        type: String, 
        required: true 
    }, // Formato de string plano YYYY-MM-DD (Evita desvíos por Timezone)
    semana: { 
        type: Number, 
        required: true 
    },
    anio: { 
        type: Number, 
        required: true 
    },
    placa: { 
        type: String, 
        required: true, 
        uppercase: true,
        trim: true 
    },
    cc_conductor: { 
        type: String, 
        required: true, 
        trim: true 
    },
    cc_responsable_ruta: { 
        type: String, 
        required: true, 
        trim: true 
    },
    
    // Tripulación (Campos fijos corregidos según auditoría QA, sin conectores "de/de_la")
    cc_auxiliar_1: { type: String, trim: true, default: null },
    cc_auxiliar_2: { type: String, trim: true, default: null },
    nombre_conductor: { type: String, trim: true, default: null },
    nombre_responsable_ruta: { type: String, trim: true, default: null },
    nombre_auxiliar_reparto: { type: String, trim: true, default: null },
    transporte: { type: String, trim: true, default: null },

    // Indicadores KPI y PI históricos y vigentes (Estructura de datos unificada)
    cashless_incumplidos: { type: Number, default: null },
    modulacion_por_placa: { type: Number, default: null },
    sac_atribuibles_uc: { type: Number, default: null },
    tiempo_de_atencion_en_pdv: { type: Number, default: null }, // Almacenado como número directo en minutos planos
    paradas_no_planeadas: { type: Number, default: null },
    adherencia_al_check_list: { type: Number, default: null },
    salidas_primeros_viajes: { type: Number, default: null }, // Porcentaje numérico plano (Ej: 70)
    entrega_en_rangos: { type: Number, default: null },
    rechazos_tat_logistico: { type: Number, default: null },
    
    // Campo retenido de manera obligatoria únicamente por compatibilidad histórica del esquema
    cantidad_de_rutas_mayor_a_10_hr: { type: Number, default: null },

    // Nuevos campos adicionados del módulo de desempeño oficial 2026
    recargues: { type: Number, default: null },
    descanso_efectivo: { type: Number, default: null },
    ausentismo: { type: Number, default: null } // Preparado estructuralmente como null
}, { 
    timestamps: true,
    collection: 'desempenokpis'
});

/**
 * ÍNDICE COMPUESTO ÚNICO (LLAVE QUÍNTUPLE)
 * Crucial para la consistencia transaccional en MongoDB Atlas. Prevé la duplicidad
 * de registros si se ejecutan cargas masivas por lote simultáneas de una misma placa.
 */
DesempenoKpiSchema.index({ 
    cd: 1, 
    fecha: 1, 
    placa: 1, 
    cc_conductor: 1, 
    cc_responsable_ruta: 1 
}, { unique: true });

module.exports = mongoose.model('DesempenoKpi', DesempenoKpiSchema);