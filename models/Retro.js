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
        // Agregamos 'Reporte de roturas' al listado permitido
        enum: ['Pre ruta', 'En ruta', 'Post ruta', 'PDV o Ruta Critica', 'Reporte de roturas'] 
    },
    // Nuevos campos para el detalle de averías
    categoriaRotura: { type: String, default: null },
    materialRotura: { type: String, default: null },
    unidadesRotas: { type: Number, default: 0 },
    
    comentarios: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Retro", RetroSchema);