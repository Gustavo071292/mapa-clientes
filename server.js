require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mapa_clientes";

// ====== MIDDLEWARES ======
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== CONNECT MONGODB ======
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    console.log("   URI:", MONGO_URI);
    console.log("   DB :", mongoose.connection?.name || "(sin nombre)");
  })
  .catch((err) => {
    console.error("❌ Error MongoDB:", err.message);
    process.exit(1);
  });

// ====== ENDPOINTS DE APOYO (API) ======

// Este es el que llena tu selector de Popayán, Tuluá y Cali
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

// Health check para saber si el servidor responde
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "mapa-clientes",
    time: new Date().toISOString(),
  });
});

// ====== RUTAS MODULARES ======

// Aquí conectamos todas las rutas de búsqueda de clientes
// IMPORTANTE: Ahora todas empezarán por /clientes (ej: /clientes/buscar)
app.use("/clientes", deliveryRoutes);

// ====== SERVIR EL FRONTEND ======

// Home principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en: http://localhost:${PORT}`);
  console.log(`🩺 Health check:    http://localhost:${PORT}/health`);
  console.log(`📍 API CDs:        http://localhost:${PORT}/api/cds`);
});