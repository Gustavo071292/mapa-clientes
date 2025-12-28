// server.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clientesDB";

// ====== MIDDLEWARES ======
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== CONNECT MONGODB ======
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB (clientesDB)"))
  .catch((err) => {
    console.error("❌ Error MongoDB:", err.message);
    process.exit(1);
  });

// ====== SCHEMA REAL ======
const ClienteSchema = new mongoose.Schema(
  {
    codigo: String,
    nombre: String,
    barrio: String,
    telefono: String,
    lat: Number,
    lng: Number,
  },
  { collection: "clientes" }
);

const Cliente = mongoose.model("Cliente", ClienteSchema);

// ====== ROUTES ======
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "mapa-clientes",
    time: new Date().toISOString(),
  });
});

// 🔎 Buscar cliente por código (SINGLE)
app.get("/clientes/:codigo", async (req, res) => {
  try {
    const codigo = String(req.params.codigo).trim();
    if (!codigo) {
      return res.status(400).json({ error: "Código requerido" });
    }

    const cliente = await Cliente.findOne(
      { codigo },
      { _id: 0, codigo: 1, nombre: 1, barrio: 1, telefono: 1, lat: 1, lng: 1 }
    ).lean();

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    if (typeof cliente.lat !== "number" || typeof cliente.lng !== "number") {
      return res.status(422).json({
        error: "Cliente sin coordenadas válidas",
        codigo: cliente.codigo,
      });
    }

    res.json(cliente);
  } catch (err) {
    console.error("Error /clientes/:codigo", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// ✅ NUEVO: Búsqueda masiva por códigos (para archivo .txt/.csv)
// POST /clientes/por-codigos
// Body: { "codigos": ["14383952", "00000000"] }
app.post("/clientes/por-codigos", async (req, res) => {
  try {
    const { codigos } = req.body;

    if (!Array.isArray(codigos) || codigos.length === 0) {
      return res.status(400).json({ error: "Se requiere { codigos: [] }" });
    }

    const limpios = codigos
      .map((c) => String(c).trim())
      .filter(Boolean);

    const unicos = Array.from(new Set(limpios));

    const LIMITE = 2000;
    if (unicos.length > LIMITE) {
      return res.status(413).json({
        error: `Demasiados códigos. Máximo permitido: ${LIMITE}`,
      });
    }

    const encontrados = await Cliente.find(
      { codigo: { $in: unicos } },
      { _id: 0, codigo: 1, nombre: 1, barrio: 1, telefono: 1, lat: 1, lng: 1 }
    ).lean();

    const encontradosSet = new Set(encontrados.map((c) => String(c.codigo)));
    const noEncontrados = unicos.filter((c) => !encontradosSet.has(String(c)));

    const sinCoordenadas = [];
    const conCoordenadas = [];

    for (const c of encontrados) {
      if (typeof c.lat !== "number" || typeof c.lng !== "number") {
        sinCoordenadas.push(c.codigo);
      } else {
        conCoordenadas.push(c);
      }
    }

    return res.json({
      totalSolicitados: unicos.length,
      totalEncontrados: encontrados.length,
      totalMostrables: conCoordenadas.length,
      noEncontrados,
      sinCoordenadas,
      clientes: conCoordenadas,
    });
  } catch (err) {
    console.error("Error POST /clientes/por-codigos", err);
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
  console.log(`🩺 Health:   http://localhost:${PORT}/health`)
});