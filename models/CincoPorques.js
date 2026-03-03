const mongoose = require('mongoose');
const CincoPorquesSchema = new mongoose.Schema({
    cd: String, cedula: String, placa: String, indicador: String,
    descripcion_novedad: String, porques: [String], causa_raiz: String,
    plan_accion: String, responsable: String, fecha_compromiso: Date,
    estado: { type: String, default: 'Pendiente' },
    fecha_creacion: { type: Date, default: Date.now }
}, { strict: false }); // Esto permite guardar cualquier campo extra que envíes
module.exports = mongoose.model('CincoPorques', CincoPorquesSchema);