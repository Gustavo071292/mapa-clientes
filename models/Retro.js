const mongoose = require("mongoose");

const RetroSchema = new mongoose.Schema({
    fechaReporte: { type: Date, required: true },
    cedula: { type: String, required: true },
    cd: { type: String, required: true },
    placa: { type: String, required: true },
    codigoCliente: { type: String, required: true },
    tipoRetro: { 
        type: String, 
        required: true,
        enum: ['Pre ruta', 'En ruta', 'Post ruta', 'PDV o Ruta Critica', 'Reporte de roturas', 'Checklist T2', 'Reportes ACIS'] 
    },
    // Nuevos campos para el detalle de averías
    categoriaRotura: { type: String, default: null },
    materialRotura: { type: String, default: null },
    unidadesRotas: { type: Number, default: 0 },
    
    // --- CAMPO INDICADOR (Vital para el Pareto) ---
    indicador: { type: String, default: 'General' },

    comentarios: { type: String, default: "" },

    // --- CAMPOS DE GESTIÓN (Lo que faltaba para el Dashboard) ---
    estado: { 
        type: String, 
        enum: ['Pendiente', 'Realizado'], 
        default: 'Pendiente' 
    },
    comentarioGestion: { type: String, default: "" },
    fechaGestion: { type: Date },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Retro", RetroSchema);