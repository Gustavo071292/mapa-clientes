const mongoose = require('mongoose');

const CincoPorquesSchema = new mongoose.Schema({
    cd: String,
    transporte: String,
    placa: String,
    indicador: String,
    descripcion_novedad: String,
    // Definimos los campos individuales para que coincidan con el payload del frontend
    p1: String,
    p2: String,
    p3: String,
    p4: String,
    p5: String,
    causa_raiz: String,
    plan_accion: String,
    responsable: String,
    fecha_compromiso: Date,
    estado: { 
        type: String, 
        enum: ['Pendiente', 'En Proceso', 'Cerrado'], 
        default: 'Pendiente' 
    },
    fecha_creacion: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    strict: false,
    collection: 'cinco_porques' // Nombre sugerido para la colección en Atlas
});

module.exports = mongoose.model('CincoPorques', CincoPorquesSchema);