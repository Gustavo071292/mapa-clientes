const mongoose = require('mongoose');

const CincoPorquesSchema = new mongoose.Schema({
    cd: String,
    transporte: String,
    placa: String,
    indicador: String,
    descripcion_novedad: String,
    p1: String,
    p2: String,
    p3: String,
    p4: String,
    p5: String,
    causa_raiz: String,
    plan_accion: String,
    responsable: String,
    fecha_compromiso: Date,
    // CORRECCIÓN: Agregamos 'Realizado' para que coincida con el Dashboard
    estado: { 
        type: String, 
        enum: ['Pendiente', 'En Proceso', 'Realizado', 'Cerrado'], 
        default: 'Pendiente' 
    },
    // CAMPOS PARA GESTIÓN DESDE DASHBOARD
    comentarioGestion: { type: String, default: "" },
    fechaGestion: { type: Date },
    
    fecha_creacion: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    strict: false,
    collection: 'cinco_porques' 
});

module.exports = mongoose.model('CincoPorques', CincoPorquesSchema);