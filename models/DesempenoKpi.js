const mongoose = require('mongoose');

const DesempenoKpiSchema = new mongoose.Schema({
    cd: { type: String, required: true },
    fecha: { type: String, required: true },
    semana: { type: Number, required: true },
    anio: { type: Number, required: true },

    transporte: { type: String, default: null },
    placa: { type: String, required: true },

    cc_conductor: { type: String, required: true },
    cc_responsable_ruta: { type: String, required: true },
    cc_auxiliar_1: { type: String, default: null },
    cc_auxiliar_2: { type: String, default: null },

    nombre_conductor: { type: String, default: null },
    nombre_responsable_ruta: { type: String, default: null },
    nombre_auxiliar_reparto: { type: String, default: null },

    cashless_incumplidos: { type: Number, default: null },
    modulacion_por_placa: { type: Number, default: null },
    sac_atribuibles_uc: { type: Number, default: null },
    tiempo_de_atencion_en_pdv: { type: Number, default: null },
    paradas_no_planeadas: { type: Number, default: null },
    adherencia_al_check_list: { type: Number, default: null },
    salidas_primeros_viajes: { type: Number, default: null },
    salidas_primeros_viajes_label: { type: String, default: null },
    entrega_en_rangos: { type: Number, default: null },
    rechazos_tat_logistico: { type: Number, default: null },
    cantidad_de_rutas_mayor_a_10_hr: { type: Number, default: null }
}, { timestamps: true });

DesempenoKpiSchema.index({
    cd: 1,
    fecha: 1,
    placa: 1,
    cc_conductor: 1,
    cc_responsable_ruta: 1
}, { unique: true });

DesempenoKpiSchema.index({
    cd: 1,
    semana: 1,
    anio: 1,
    cc_conductor: 1,
    cc_responsable_ruta: 1,
    fecha: 1
});

module.exports = mongoose.model('DesempenoKpi', DesempenoKpiSchema);