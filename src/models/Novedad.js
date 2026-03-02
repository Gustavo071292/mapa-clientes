const mongoose = require('mongoose');

const NovedadSchema = new mongoose.Schema({
    fecha: { type: Date, required: true },
    cedula: { type: String, required: true, trim: true },
    cd: { type: String, required: true },
    placa: { type: String, required: true, trim: true },
    codigo_cliente: { 
        type: String, 
        required: true,
        match: [/^\d{8}$/, 'El código de cliente debe tener 8 dígitos'] 
    },
    tipo_retroalimentacion: { 
        type: String, 
        required: true,
        enum: ['Pre ruta', 'En ruta', 'Post ruta'] 
    },
    observacion: { 
        type: String, 
        required: true, 
        maxlength: 255 
    },
    // --- CAMPOS NUEVOS PARA EL DASHBOARD LOCO ---
    estado: { 
        type: String, 
        enum: ['Pendiente', 'Realizado', 'No ejecutado'], 
        default: 'Pendiente' 
    },
    comentario_gestion: { type: String, default: "" },
    fecha_gestion: { type: Date },
    fecha_registro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Novedad', NovedadSchema);