// server.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mapa_clientes";

// ====== MIDDLEWARES ======
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== CONNECT MONGODB ======
mongoose
  .connect(MONGO_URI)
  .then(() => {
    // ✅ Ahora sí: deja evidencia clara de a qué DB/URI quedó conectado
    console.log("✅ Conectado a MongoDB");
    console.log("   URI:", MONGO_URI);
    console.log("   DB :", mongoose.connection?.name || "(sin nombre)");
  })
  .catch((err) => {
    console.error("❌ Error MongoDB:", err.message);
    process.exit(1);
  });

// ====== HELPERS ======
function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  // soporta coma decimal "1,612946"
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ====== SCHEMA ======
// Nota: strict:false permite campos extras sin romper
const ClienteSchema = new mongoose.Schema(
  {
    CD: String,
    Cliente: String,
    Nombre: String,
    Barrio: String,
    Poblacion: mongoose.Schema.Types.Mixed,
    Telefono: String,

    Latitud: mongoose.Schema.Types.Mixed,
    Longitud: mongoose.Schema.Types.Mixed,

    // Extras
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

    // ✅ NUEVOS CAMPOS (opcional): los declaramos para claridad,
    // pero con strict:false igual los guarda aunque no estén aquí.
    Cobro: mongoose.Schema.Types.Mixed,
    NPS: mongoose.Schema.Types.Mixed,
  },
  {
    collection: "clientes",
    strict: false,
  }
);

const ClienteModel = mongoose.model("Cliente", ClienteSchema);

// ====== ROUTES ======
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "mapa-clientes",
    time: new Date().toISOString(),
  });
});

// ✅ Debug rápido: ver a qué Mongo/DB está conectado el servidor
// (Esto NO toca lógica de negocio)
app.get("/debug/mongo", (req, res) => {
  res.json({
    ok: true,
    mongo: {
      uri: MONGO_URI, // local: no es sensible. Si luego lo publicas, lo quitamos.
      db: mongoose.connection?.name || null,
      host: mongoose.connection?.host || null,
      port: mongoose.connection?.port || null,
      readyState: mongoose.connection?.readyState, // 1 = conectado
    },
  });
});

// Lista fija de CDs (para botones/selector)
app.get("/api/cds", (req, res) => {
  res.json({
    ok: true,
    data: [
      { code: "AV28", name: "Popayán" },
      { code: "AV57", name: "Tuluá" },
      { code: "AV46", name: "Cali" },
    ],
  });
});

// ✅ BÚSQUEDA CORRECTA: por CD + Cliente
// GET /clientes/buscar?cd=AV46&cliente=12565416
app.get("/clientes/buscar", async (req, res) => {
  try {
    const cd = toStr(req.query.cd);
    const cliente = toStr(req.query.cliente);

    if (!cd || !cliente) {
      return res
        .status(400)
        .json({ error: "Se requiere ?cd=...&cliente=..." });
    }

    const doc = await ClienteModel.findOne(
      { CD: cd, Cliente: cliente },
      {
        _id: 0,
        // Ojo: CD se usa para filtrar, pero el frontend no lo mostrará
        CD: 1,
        Cliente: 1,
        Nombre: 1,
        Barrio: 1,
        Poblacion: 1,
        Telefono: 1,
        Latitud: 1,
        Longitud: 1,

        ZT: 1,
        COM: 1,
        ZonaVenta: 1,
        Distrito: 1,
        EntregaFREE: 1,
        DiaFlex: 1,
        ValorMinimoFlex: 1,
        ValorFlex: 1,
        Cerveza: 1,
        NABS: 1,
        MKP: 1,

        // ✅ AGREGADOS
        Cobro: 1,
        NPS: 1,
      }
    ).lean();

    if (!doc) return res.status(404).json({ error: "Cliente no encontrado" });

    const lat = toNum(doc.Latitud);
    const lng = toNum(doc.Longitud);

    if (lat === null || lng === null) {
      return res.status(422).json({
        error: "Cliente sin coordenadas válidas",
        CD: doc.CD,
        Cliente: doc.Cliente,
      });
    }

    // ✅ Respuesta: dejamos todo "plano" + lat/lng numéricos
    // (el frontend ya se encarga de NO mostrar CD/lat/lng)
    return res.json({
      CD: doc.CD,
      Cliente: doc.Cliente,
      Nombre: doc.Nombre,
      Barrio: doc.Barrio,
      Poblacion: doc.Poblacion,
      Telefono: doc.Telefono,
      lat,
      lng,

      // valores / comercial
      EntregaFREE: doc.EntregaFREE,
      DiaFlex: doc.DiaFlex,
      ValorMinimoFlex: doc.ValorMinimoFlex,
      ValorFlex: doc.ValorFlex,
      ZonaVenta: doc.ZonaVenta,
      Distrito: doc.Distrito,
      COM: doc.COM,
      Cerveza: doc.Cerveza,
      NABS: doc.NABS,
      MKP: doc.MKP,

      // ✅ AGREGADOS (para el popup)
      Cobro: doc.Cobro,
      NPS: doc.NPS,

      // por si lo usas después
      ZT: doc.ZT,
    });
  } catch (err) {
    console.error("Error GET /clientes/buscar", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// ✅ Compatibilidad: tu endpoint viejo /clientes/:codigo
app.get("/clientes/:codigo", async (req, res) => {
  try {
    const codigo = toStr(req.params.codigo);
    if (!codigo) return res.status(400).json({ error: "Código requerido" });

    const doc = await ClienteModel.findOne(
      { Cliente: codigo },
      {
        _id: 0,
        CD: 1,
        Cliente: 1,
        Nombre: 1,
        Barrio: 1,
        Poblacion: 1,
        Telefono: 1,
        Latitud: 1,
        Longitud: 1,

        COM: 1,
        ZonaVenta: 1,
        Distrito: 1,
        EntregaFREE: 1,
        DiaFlex: 1,
        ValorMinimoFlex: 1,
        ValorFlex: 1,
        Cerveza: 1,
        NABS: 1,
        MKP: 1,

        // ✅ AGREGADOS
        Cobro: 1,
        NPS: 1,
      }
    ).lean();

    if (!doc) return res.status(404).json({ error: "Cliente no encontrado" });

    const lat = toNum(doc.Latitud);
    const lng = toNum(doc.Longitud);

    if (lat === null || lng === null) {
      return res.status(422).json({
        error: "Cliente sin coordenadas válidas",
        Cliente: doc.Cliente,
        CD: doc.CD,
      });
    }

    return res.json({
      CD: doc.CD,
      Cliente: doc.Cliente,
      Nombre: doc.Nombre,
      Barrio: doc.Barrio,
      Poblacion: doc.Poblacion,
      Telefono: doc.Telefono,
      lat,
      lng,

      EntregaFREE: doc.EntregaFREE,
      DiaFlex: doc.DiaFlex,
      ValorMinimoFlex: doc.ValorMinimoFlex,
      ValorFlex: doc.ValorFlex,
      ZonaVenta: doc.ZonaVenta,
      Distrito: doc.Distrito,
      COM: doc.COM,
      Cerveza: doc.Cerveza,
      NABS: doc.NABS,
      MKP: doc.MKP,

      // ✅ AGREGADOS
      Cobro: doc.Cobro,
      NPS: doc.NPS,
    });
  } catch (err) {
    console.error("Error /clientes/:codigo", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// ✅ Búsqueda masiva por CD + lista de clientes
// POST /clientes/por-clientes
// Body: { "cd":"AV46", "clientes":["12565416","13819167"] }
app.post("/clientes/por-clientes", async (req, res) => {
  try {
    const cd = toStr(req.body.cd);
    const clientes = req.body.clientes;

    if (!cd) return res.status(400).json({ error: "Se requiere { cd }" });
    if (!Array.isArray(clientes) || clientes.length === 0) {
      return res.status(400).json({ error: "Se requiere { clientes: [] }" });
    }

    const limpios = clientes.map(toStr).filter(Boolean);
    const unicos = Array.from(new Set(limpios));

    const LIMITE = 2000;
    if (unicos.length > LIMITE) {
      return res
        .status(413)
        .json({ error: `Demasiados clientes. Máximo: ${LIMITE}` });
    }

    const encontrados = await ClienteModel.find(
      { CD: cd, Cliente: { $in: unicos } },
      {
        _id: 0,
        CD: 1,
        Cliente: 1,
        Nombre: 1,
        Barrio: 1,
        Poblacion: 1,
        Telefono: 1,
        Latitud: 1,
        Longitud: 1,

        COM: 1,
        ZonaVenta: 1,
        Distrito: 1,
        EntregaFREE: 1,
        DiaFlex: 1,
        ValorMinimoFlex: 1,
        ValorFlex: 1,
        Cerveza: 1,
        NABS: 1,
        MKP: 1,

        // ✅ AGREGADOS
        Cobro: 1,
        NPS: 1,
      }
    ).lean();

    const encontradosSet = new Set(encontrados.map((d) => toStr(d.Cliente)));
    const noEncontrados = unicos.filter((c) => !encontradosSet.has(toStr(c)));

    const sinCoordenadas = [];
    const conCoordenadas = [];

    for (const d of encontrados) {
      const lat = toNum(d.Latitud);
      const lng = toNum(d.Longitud);

      if (lat === null || lng === null) {
        sinCoordenadas.push(d.Cliente);
      } else {
        conCoordenadas.push({
          CD: d.CD,
          Cliente: d.Cliente,
          Nombre: d.Nombre,
          Barrio: d.Barrio,
          Poblacion: d.Poblacion,
          Telefono: d.Telefono,
          lat,
          lng,

          EntregaFREE: d.EntregaFREE,
          DiaFlex: d.DiaFlex,
          ValorMinimoFlex: d.ValorMinimoFlex,
          ValorFlex: d.ValorFlex,
          ZonaVenta: d.ZonaVenta,
          Distrito: d.Distrito,
          COM: d.COM,
          Cerveza: d.Cerveza,
          NABS: d.NABS,
          MKP: d.MKP,

          // ✅ AGREGADOS
          Cobro: d.Cobro,
          NPS: d.NPS,
        });
      }
    }

    return res.json({
      cd,
      totalSolicitados: unicos.length,
      totalEncontrados: encontrados.length,
      totalMostrables: conCoordenadas.length,
      noEncontrados,
      sinCoordenadas,
      clientes: conCoordenadas,
    });
  } catch (err) {
    console.error("Error POST /clientes/por-clientes", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// ====== HOME ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`🗺️  Frontend: http://localhost:${PORT}`);
  console.log(`🩺 Health:   http://localhost:${PORT}/health`);
  console.log(`🧩 Debug:    http://localhost:${PORT}/debug/mongo`);
  console.log(
    `🔎 Buscar:   http://localhost:${PORT}/clientes/buscar?cd=AV46&cliente=12565416`
  );
});
