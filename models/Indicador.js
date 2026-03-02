const mongoose = require('mongoose');

const IndicadorSchema = new mongoose.Schema({
    cd: { type: String, required: true, enum: ['Cali', 'Popayan', 'Tulua'] }, 
    cedula: { type: String, required: true },
    nombre_operador: { type: String, required: true },
    // Usamos un objeto flexible para los KPIs
    kpis: {
        type: Map,
        of: String // Aquí guardamos tanto el valor como la meta (ej: "95% / Meta: 90%")
    },
    mes_periodo: { type: String, required: true },
    fecha_actualizacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Indicador', IndicadorSchema);