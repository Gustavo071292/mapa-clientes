require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const deliveryRoutes = require("./routes/deliveryRoutes");
const retroRoutes = require("./routes/retroRoutes");
const rtaRoutes = require("./routes/rtaRoutes");

const app = express();
app.use(express.json());

// Servir archivos estáticos de public
app.use(express.static(path.join(__dirname, "public")));

// ====== GESTIÓN RTA ======
app.get("/gestion-rta", (req, res) => {
    res.sendFile(path.join(__dirname, "views/gestion-rta/principal.html"));
});

app.get("/gestion-rta/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/gestion-rta/principal.html"));
});

app.get("/gestion-rta/nuevo", (req, res) => {
    res.sendFile(path.join(__dirname, "views/gestion-rta/index.html"));
});

// Servir archivos estáticos de views DESPUÉS de rutas específicas
app.use(express.static(path.join(__dirname, "views")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ CONECTADO A ATLAS"))
  .catch(err => console.log("❌ Error:", err.message));

// ====== VISTAS DE NAVEGACIÓN ======
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/portal/index.html")));
app.get("/clientes", (req, res) => res.sendFile(path.join(__dirname, "public/pilares/delivery/clientes/index.html")));

// ====== PILAR EQUIPOS EMPODERADOS ======
app.get("/equipos-empoderados/retro/novedades", (req, res) => {
    res.sendFile(path.join(__dirname, "views/equipos-empoderados/retroalimentacion/novedades.html"));
});

app.get("/equipos-empoderados/retro/cinco-porques", (req, res) => {
    res.sendFile(path.join(__dirname, "views/equipos-empoderados/retroalimentacion/cinco-porques.html"));
});

app.get("/equipos-empoderados/retro/resumen-gerencial", (req, res) => {
    res.sendFile(path.join(__dirname, "views/equipos-empoderados/dashboard-ejecutivo.html"));
});

// ====== APIs ======
app.get("/api/cds", (req, res) => {
    res.json({
        ok: true,
        data: [
            { code: "AV28", name: "Popayán" },
            { code: "AV57", name: "Tuluá" },
            { code: "AV46", name: "Cali" },
            { code: "AV01", name: "Yumbo" }
        ]
    });
});

app.use("/api/delivery", deliveryRoutes);
app.use("/api/retro", retroRoutes);
app.use("/api/rta", rtaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Portal DPO Funcionando en: http://localhost:${PORT}`));