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
        enum: ['Pre ruta', 'En ruta', 'Post ruta', 'PDV o Ruta Critica'] 
    },
    comentarios: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Retro", RetroSchema);