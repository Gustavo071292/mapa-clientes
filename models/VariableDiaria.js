const mongoose = require('mongoose');

const VariableDiariaSchema = new mongoose.Schema({
    identificador: { type: String, required: true, index: true },
    fecha: { type: Date, required: true },
    colaborador: String,
    cargo: String,
    grupo: String, // Representa el CD para filtros opcionales
    rechazos: { type: Number, default: 0 },
    ausencias_injustificadas: { type: Number, default: 0 },
    asistencia: { type: Boolean, default: true },
    dias_trabajados: { type: Number, default: 0 },
    cumplimiento_perc: { type: Number, default: 0 },
    monto_variable_dia: { type: Number, default: 0 }
}, { timestamps: true });

// Índice compuesto único para evitar duplicidad de registros en la misma fecha
VariableDiariaSchema.index({ identificador: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('VariableDiaria', VariableDiariaSchema);