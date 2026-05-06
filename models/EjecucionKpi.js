const mongoose = require('mongoose');

const EjecucionKpiSchema = new mongoose.Schema({
    cedula: { type: String, required: true },
    nombre_completo: { type: String, default: 'N/A' },
    tml: { type: Number, default: 0 },
    tr: { type: Number, default: 0 },
    tv: { type: Number, default: 0 },
    roturas: { type: Number, default: 0 },
    excesos_jl: { type: Number, default: 0 },
    supervisor: { type: String, default: 'N/A' },
    personal: { type: String, default: 'N/A' },
    mes: { type: String, required: true }, // Formato YYYY-MM
    cd: { type: String, required: true }  // CALI, POPAYAN, TULUA, YUMBO
}, { timestamps: true });

// Índice único compuesto para evitar duplicidad
EjecucionKpiSchema.index({ cedula: 1, cd: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model('EjecucionKpi', EjecucionKpiSchema);