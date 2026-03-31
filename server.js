require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

// IMPORTANTE: Recuperamos ambos pilares para que nada quede por fuera
const deliveryRoutes = require("./routes/deliveryRoutes"); 
const retroRoutes = require("./routes/retroRoutes");

const app = express();
app.use(express.json());

// Servir archivos estáticos (Para que el Dashboard tenga color y el mapa cargue)
app.use(express.static(path.join(__dirname, "public"))); 
app.use(express.static(path.join(__dirname, "views"))); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ CONECTADO A ATLAS"))
  .catch(err => console.log("❌ Error:", err.message));

// ====== VISTAS DE NAVEGACIÓN (Corrigiendo el "Cannot GET") ======

// Pilar Delivery (Búsqueda de Clientes)
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/portal/index.html")));
app.get("/clientes", (req, res) => res.sendFile(path.join(__dirname, "public/pilares/delivery/clientes/index.html")));

// Pilar Equipos Empoderados (Rutas exactas que fallaban)
app.get("/equipos-empoderados/retro/novedades", (req, res) => {
    res.sendFile(path.join(__dirname, "views/equipos-empoderados/retroalimentacion/novedades.html"));
});
app.get("/equipos-empoderados/retro/cinco-porques", (req, res) => {
    res.sendFile(path.join(__dirname, "views/equipos-empoderados/retroalimentacion/cinco-porques.html"));
});
app.get("/equipos-empoderados/retro/resumen-gerencial", (req, res) => {
    res.sendFile(path.join(__dirname, "views/equipos-empoderados/dashboard-ejecutivo.html"));
});

// ====== APIs (Mapa + Novedades) ======
app.get("/api/cds", (req, res) => {
    res.json({ ok: true, data: [{ code: "AV28", name: "Popayán" }, { code: "AV57", name: "Tuluá" }, { code: "AV46", name: "Cali" }, { code: "AV01", name: "Yumbo" }] });
});

app.use("/api/delivery", deliveryRoutes); // RESTAURADO: Búsqueda de clientes activa
app.use("/api/retro", retroRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Portal DPO Funcionando en: http://localhost:${PORT}`));