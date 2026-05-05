const mongoose = require('mongoose');

const VariableMensualSchema = new mongoose.Schema({
    identificador: { type: String, required: true, index: true },
    mes: { type: String, required: true }, // Formato "YYYY-MM"
    nombre_completo: { type: String, default: 'N/A' },
    cargo: { type: String, default: 'N/A' },
    cd: { type: String, default: 'N/A' },
    pago_variable_dt: { type: Number, default: 0 },
    salario_variable: { type: Number, default: 0 },
    porcentaje_variable: { type: Number, default: 0 }, // Guardado como número (ej: 92.5)
    dias_trabajados_total: { type: Number, default: 0 },
    ausencia_justificada: { type: Number, default: 0 },
    ausencia_injustificada: { type: Number, default: 0 }
}, { timestamps: true });

// Unicidad para evitar duplicados en auditoría
VariableMensualSchema.index({ identificador: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model('VariableMensual', VariableMensualSchema);