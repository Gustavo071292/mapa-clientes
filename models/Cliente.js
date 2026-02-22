const mongoose = require("mongoose");

const ClienteSchema = new mongoose.Schema(
  {
    CD: String,
    Cliente: String,
    Nombre: String,
    Propietario: String, // ✅ Campo nuevo
    Barrio: String,
    Direccion: String,   // ✅ Campo nuevo
    Poblacion: mongoose.Schema.Types.Mixed,
    Telefono: String,
    Latitud: mongoose.Schema.Types.Mixed,
    Longitud: mongoose.Schema.Types.Mixed,
    ZT: mongoose.Schema.Types.Mixed,
    COM: mongoose.Schema.Types.Mixed,
    ZonaVenta: mongoose.Schema.Types.Mixed,
    Distrito: mongoose.Schema.Types.Mixed,
    EntregaFREE: mongoose.Schema.Types.Mixed,
    DiaFlex: mongoose.Schema.Types.Mixed,
    ValorMinimoFlex: mongoose.Schema.Types.Mixed,
    ValorFlex: mongoose.Schema.Types.Mixed,
    Cerveza: mongoose.Schema.Types.Mixed,
    NABS: mongoose.Schema.Types.Mixed,
    MKP: mongoose.Schema.Types.Mixed,
    Cobro: mongoose.Schema.Types.Mixed,
    NPS: mongoose.Schema.Types.Mixed,
    ETA: mongoose.Schema.Types.Mixed, // ✅ Campo nuevo (ETA Logístico)
  },
  { 
    collection: "clientes", 
    strict: false 
  }
);

module.exports = mongoose.model("Cliente", ClienteSchema);