// Importamos ambos modelos para que el controlador pueda manejar los dos formularios
const Novedad = require('../models/Novedad');
const CincoPorques = require('../models/CincoPorques'); // Asegúrate de tener este modelo creado

// 1. Lógica para el Reporte de Novedades / Ruta
exports.guardarNovedad = async (req, res) => {
    try {
        const nuevaNovedad = new Novedad(req.body);
        await nuevaNovedad.save();
        res.status(200).json({ exito: true, mensaje: "Novedad guardada exitosamente en Atlas" });
    } catch (error) {
        console.error("Error en Novedades:", error);
        res.status(500).json({ exito: false, mensaje: "Error al procesar la novedad" });
    }
};

// 2. Lógica para la Herramienta 5 Porqués (Análisis DPO)
exports.guardarAnalisisDPO = async (req, res) => {
    try {
        const nuevoAnalisis = new CincoPorques(req.body);
        await nuevoAnalisis.save();
        res.status(200).json({ exito: true, mensaje: "Análisis DPO guardado exitosamente en Atlas" });
    } catch (error) {
        console.error("Error en DPO:", error);
        res.status(500).json({ exito: false, mensaje: "Error al guardar el análisis DPO" });
    }
};

// Función para traer TODO unificado (La Licuadora)
exports.obtenerConsolidadoValle = async (req, res) => {
    try {
        // Traemos ambas colecciones en paralelo para ganar velocidad
        const [novedades, porques] = await Promise.all([
            Novedad.find().lean(),
            CincoPorques.find().lean()
        ]);

        // Marcamos cada uno para saber de dónde viene en la tabla del jefe
        const novedadesMarcadas = novedades.map(n => ({ ...n, tipoDoc: 'Novedad', icono: '🚚' }));
        const porquesMarcados = porques.map(p => ({ ...p, tipoDoc: '5 Porqués', icono: '🤝' }));

        // Unificamos y ordenamos por fecha (lo más reciente arriba)
        const consolidado = [...novedadesMarcadas, ...porquesMarcados].sort((a, b) => {
            return new Date(b.fecha || b.fecha_creacion) - new Date(a.fecha || a.fecha_creacion);
        });

        res.status(200).json({
            exito: true,
            total: consolidado.length,
            data: consolidado
        });
    } catch (error) {
        console.error("Error en la Licuadora:", error);
        res.status(500).json({ exito: false, mensaje: "Error al unificar la data del Valle" });
    }
};

// Función para actualizar el estado (Lo que tú harás como supervisor)
exports.actualizarEstadoReporte = async (req, res) => {
    const { id, tipoDoc, nuevoEstado, comentario } = req.body;
    try {
        const Modelo = (tipoDoc === 'Novedad') ? Novedad : CincoPorques;
        
        await Modelo.findByIdAndUpdate(id, {
            estado: nuevoEstado,
            comentario_gestion: comentario,
            fecha_gestion: Date.now()
        });

        res.json({ exito: true, mensaje: "Gestión guardada berracamente" });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: "No se pudo actualizar la gestión" });
    }
};