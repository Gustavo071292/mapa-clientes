const mongoose = require('mongoose');

const CincoPorquesSchema = new mongoose.Schema({
    cd: { type: String, required: true },
    cedula: { type: String, required: true, trim: true },
    placa: { type: String, required: true, trim: true },
    indicador: { type: String, required: true },
    descripcion_novedad: { type: String, required: true },
    p1: { type: String, required: true },
    p2: { type: String, required: true },
    p3: { type: String, required: true },
    p4: { type: String, required: true },
    p5: { type: String, required: true },
    causa_raiz: { type: String, required: true },
    plan_accion: { type: String, required: true },
    responsable: { type: String, required: true },
    fecha_compromiso: { type: Date, required: true },
    
    // --- CAMPOS NUEVOS PARA LA TORRE DE CONTROL ---
    estado: { 
        type: String, 
        enum: ['Pendiente', 'Realizado', 'No ejecutado'], 
        default: 'Pendiente' 
    },
    comentario_gestion: { type: String, default: "" },
    fecha_gestion: { type: Date },
    fecha_creacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CincoPorques', CincoPorquesSchema);