const mongoose = require('mongoose');

const CincoPorquesSchema = new mongoose.Schema({
    id_novedad: { type: mongoose.Schema.Types.ObjectId, ref: 'Novedad' }, // Conecta con el reporte inicial
    fecha_analisis: { type: Date, default: Date.now },
    cd: { type: String, required: true },
    operador: { type: String, required: true },
    
    // El hilo conductor del análisis guiado por IA
    analisis: {
        pregunta_1: { type: String }, // ¿Por qué ocurrió la novedad?
        respuesta_1: { type: String },
        pregunta_2: { type: String },
        respuesta_2: { type: String },
        pregunta_3: { type: String },
        respuesta_3: { type: String },
        pregunta_4: { type: String },
        respuesta_4: { type: String },
        pregunta_5: { type: String },
        respuesta_5: { type: String }
    },

    causa_raiz: { type: String, required: true }, // Conclusión final de la IA
    plan_accion: {
        accion: { type: String, required: true }, // Lo que se va a hacer
        fecha_cierre: { type: Date },
        responsable: { type: String },
        estatus: { type: String, enum: ['Abierto', 'Cerrado'], default: 'Abierto' }
    },
    
    auditado: { type: Boolean, default: false } // Para control de Gerencia
});

module.exports = mongoose.model('CincoPorques', CincoPorquesSchema);