const mongoose = require('mongoose');

/**
 * Esquema de Desempeño Operativo (Data Transaccional)
 * Almacena los resultados diarios importados desde el Excel.
 */
const DesempenoKpiSchema = new mongoose.Schema({
    // Información de Contexto
    cd: { 
        type: String, 
        required: true 
    }, // CALI, POPAYAN, TULUA
    fecha: { 
        type: String, 
        required: true 
    }, // Formato YYYY-MM-DD
    transporte: { 
        type: String, 
        default: null 
    },
    placa: { 
        type: String, 
        required: true 
    },

    // Identificación de Tripulación
    cc_conductor: { 
        type: String, 
        required: true 
    },
    cc_responsable_ruta: { 
        type: String, 
        required: true 
    },
    cc_auxiliar_1: { 
        type: String, 
        default: null 
    },
    cc_auxiliar_2: { 
        type: String, 
        default: null 
    },
    nombre_conductor: { 
        type: String, 
        default: null 
    },
    nombre_responsable_ruta: { 
        type: String, 
        default: null 
    },
    nombre_auxiliar_reparto: { 
        type: String, 
        default: null 
    },
    
    // Indicadores Operativos (KPIs reales del Excel)
    // Se usa default: null para distinguir entre "0" y "Sin Información"
    cashless_incumplidos: { type: Number, default: null },
    modulacion_por_placa: { type: Number, default: null },
    sac_atribuibles_uc: { type: Number, default: null },
    tiempo_de_atencion_en_pdv: { type: Number, default: null },
    paradas_no_planeadas: { type: Number, default: null },
    adherencia_al_check_list: { type: Number, default: null },
    
    // Gestión de tiempos (Salidas primeros viajes)
    salidas_primeros_viajes: { 
        type: Number, 
        default: null 
    }, // Almacena el total de minutos del día para cálculos lógicos
    salidas_primeros_viajes_label: { 
        type: String, 
        default: null 
    }, // Almacena el texto original HH:MM para visualización
    
    entrega_en_rangos: { type: Number, default: null },
    rechazos_tat_logistico: { type: Number, default: null },
    cantidad_de_rutas_mayor_a_10_hr: { type: Number, default: null }
}, { 
    timestamps: true 
});

/**
 * QA: Índice Único Compuesto
 * Evita la duplicidad de registros si se carga el mismo Excel varias veces.
 * La unicidad se define por la combinación de operación, vehículo y tripulación líder.
 */
DesempenoKpiSchema.index({ 
    cd: 1, 
    fecha: 1, 
    placa: 1, 
    cc_conductor: 1, 
    cc_responsable_ruta: 1 
}, { unique: true });

module.exports = mongoose.model('DesempenoKpi', DesempenoKpiSchema);