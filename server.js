require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

// Importación de rutas de lógica (API)
const deliveryRoutes = require("./routes/deliveryRoutes");
const retroRoutes = require("./src/routes/retro"); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos (Atlas o Local)
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mapa_clientes";

// ====== MIDDLEWARES ======
app.use(express.json());

// Servir archivos estáticos desde la carpeta raíz 'public'
app.use(express.static(path.join(__dirname, "public"))); 

// ====== CONEXIÓN A MONGODB ======
mongoose.connect(MONGO_URI)
  .then(() => {
    const esAtlas = MONGO_URI.includes("cluster") || MONGO_URI.includes("+srv");
    console.log(`✅ Conectado a MongoDB ${esAtlas ? "ATLAS (Nube)" : "LOCAL"}`);
  })
  .catch(err => console.error("❌ Error MongoDB:", err.message));

// ====== RUTAS DE NAVEGACIÓN (VISTAS HTML) ======

// 1. Home / Portal DPO
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); 
});

// 2. MAPA DE CLIENTES (Ruta blindada según tu estructura de carpetas)
app.get("/clientes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pilares", "delivery", "clientes", "index.html"));
});

// 3. DASHBOARD EQUIPOS (Ubicado en src/views)
app.get("/equipos-empoderados", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "views", "equipos-empoderados", "index.html"));
});

// ====== RUTAS DE API (LÓGICA DE DATOS) ======

// Endpoint para cargar los CDs en el selector del mapa
app.get("/api/cds", (req, res) => {
  res.json({
    ok: true,
    data: [
      { code: "AV28", name: "Popayán" },
      { code: "AV57", name: "Tuluá" },
      { code: "AV46", name: "Cali" },
      { code: "AV99", name: "Yumbo" },
    ],
  });
});

// Conexión con las rutas de búsqueda de clientes y retroalimentación
app.use("/api/delivery", deliveryRoutes);
app.use("/api/retro", retroRoutes);

// ====== INICIO DEL SERVIDOR ======
app.listen(PORT, () => {
  console.log(`🚀 Portal DPO Gerencia Valle listo: http://localhost:${PORT}`);
});