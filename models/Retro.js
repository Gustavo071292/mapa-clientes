const mongoose = require("mongoose");

/**
 * Esquema de gestión acumulativa para trazabilidad
 */
const gestionSchema = new mongoose.Schema({
    fecha: { type: Date, default: Date.now },
    estadoAnterior: { type: String },
    estadoNuevo: { type: String },
    comentario: { type: String },
    usuarioGestion: { type: String, default: 'Dashboard Ejecutivo' }
});

const RetroSchema = new mongoose.Schema({
    fechaReporte: { type: Date, required: true },
    cedula: { type: String, required: true },
    cd: { type: String, required: true },
    placa: { type: String, required: true },
    codigoCliente: { type: String, required: true },
    tipoRetro: { 
        type: String, 
        required: true,
        enum: [
            'Pre ruta', 
            'En ruta', 
            'Post ruta', 
            'PDV o Ruta Critica', 
            'Reporte de roturas', 
            'Checklist T2', 
            'Reportes ACIS'
        ] 
    },
    categoriaRotura: { type: String, default: null },
    materialRotura: { type: String, default: null },
    unidadesRotas: { type: Number, default: 0 },
    indicador: { type: String, default: 'General' },
    comentarios: { type: String, default: "" },

    // Control de Estado con enum ampliado
    estado: { 
        type: String, 
        enum: ['Pendiente', 'En Proceso', 'Realizado', 'Cerrado', 'No ejecutado'], 
        default: 'Pendiente' 
    },
    
    // Historial acumulativo
    historialGestion: [gestionSchema],

    // Compatibilidad legacy
    comentarioGestion: { type: String, default: "" },
    fechaGestion: { type: Date },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Retro", RetroSchema);