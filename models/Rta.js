const mongoose = require('mongoose');

const rtaSchema = new mongoose.Schema({
    // CONTEXTO
    fechaHallazgo: { type: Date, required: true },
    ejecutor: { type: String, required: true },
    negocio: { type: String, required: true },
    cd: { type: String, required: true },
    equipo: { type: String, required: true },
    tipoAnomalia: { type: String, required: true },
    tipoEvento: { type: String, required: true },
    kpi: { type: String, required: true },

    // DESCRIPCIÓN
    descripcionAnomalia: { type: String, required: true },
    descripcionProblema: { type: String, required: true },
    queDetecto: { type: String, required: true },
    cuandoDetecto: { type: Date, required: true },
    dondeDetecto: { type: String, required: true },
    quienDetecto: { type: String, required: true },
    quienIntervino: { type: String, default: "" },

    // VALIDACIÓN OPERATIVA
    punto1: { type: String, default: "" },
    resultado1: { type: String, enum: ["", "OK", "NO_OK"], default: "" },
    accion1: { type: String, default: "" },

    punto2: { type: String, default: "" },
    resultado2: { type: String, enum: ["", "OK", "NO_OK"], default: "" },
    accion2: { type: String, default: "" },

    punto3: { type: String, default: "" },
    resultado3: { type: String, enum: ["", "OK", "NO_OK"], default: "" },
    accion3: { type: String, default: "" },

    // SOP
    sopDisponible: { type: String, enum: ["Si", "No"], default: "No" },
    sopAplicable: { type: String, enum: ["Si", "No"], default: "No" },
    sopRevisar: { type: String, enum: ["Si", "No"], default: "No" },
    sopCapacitacion: { type: String, enum: ["Si", "No"], default: "No" },
    sopImplementado: { type: String, enum: ["Si", "No"], default: "No" },
    reincidencia: { type: String, enum: ["Si", "No"], default: "No" },

    // ANÁLISIS
    porQue1: { type: String, default: "" },
    porQue2: { type: String, default: "" },
    porQue3: { type: String, default: "" },
    porQue4: { type: String, default: "" },
    porQue5: { type: String, default: "" },
    causaRaiz: { type: String, required: true },

    // PLAN DE ACCIÓN
    planAccion1: { type: String, required: true },
    responsable1: { type: String, required: true },
    fechaCierre1: { type: Date, required: true },

    planAccion2: { type: String, default: "" },
    responsable2: { type: String, default: "" },
    fechaCierre2: { type: Date },

    planAccion3: { type: String, default: "" },
    responsable3: { type: String, default: "" },
    fechaCierre3: { type: Date },

    // GESTIÓN
    estado: {
        type: String,
        enum: ['Pendiente', 'En Proceso', 'Realizado', 'Cerrado'],
        default: 'Pendiente'
    },
    prioridad: {
        type: String,
        enum: ['Alta', 'Media', 'Baja'],
        default: 'Media'
    },
    comentarioGestion: { type: String, default: "" },
    fechaGestion: { type: Date },

    comentarios: [
    {
        texto: { type: String, required: true },
        estadoAnterior: { type: String, default: "" },
        estadoNuevo: { type: String, required: true },
        fecha: { type: Date, default: Date.now }
    }
],

    // INTEGRACIÓN IA
    sugerenciasIA: {
        type: [String],
        default: []
    },
    origenAnalisisIA: { type: Boolean, default: false },

    // OTROS
    fecha_creacion: {
        type: Date,
        default: Date.now
    }
}, {
    strict: false,
    collection: 'rta'
});

module.exports = mongoose.model('Rta', rtaSchema);