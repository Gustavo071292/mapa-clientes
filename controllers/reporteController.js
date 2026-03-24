const Novedad = require('../models/Retro'); 

// 1. GUARDAR NOVEDADES Y ROTURAS
exports.guardarNovedad = async (req, res) => {
    try {
        const { 
            fecha, 
            cedula, 
            cd, 
            placa, 
            codigo_cliente, 
            tipo_retroalimentacion, 
            observacion,
            // Campos específicos de la sección de roturas
            categoria, 
            material, 
            unidades 
        } = req.body;
        
        const nuevaNovedad = new Novedad({
            fechaReporte: fecha, 
            cedula: cedula,
            cd: cd,
            placa: placa,
            codigoCliente: codigo_cliente,
            tipoRetro: tipo_retroalimentacion,
            comentarios: observacion,
            // Si el tipo es 'Reporte de roturas', guardamos estos datos, si no, quedan nulos
            categoriaRotura: (tipo_retroalimentacion === 'Reporte de roturas') ? categoria : null,
            materialRotura: (tipo_retroalimentacion === 'Reporte de roturas') ? material : null,
            unidadesRotas: (tipo_retroalimentacion === 'Reporte de roturas') ? unidades : 0,
            estado: 'Pendiente'
        });

        await nuevaNovedad.save();
        res.status(200).json({ exito: true, mensaje: "✅ Reporte guardado correctamente en Atlas." });

    } catch (error) {
        console.error("❌ Error al guardar reporte de ruta:", error);
        res.status(500).json({ exito: false, mensaje: "Error al conectar con la base de datos." });
    }
};

// 2. OBTENER CONSOLIDADO (Solo Novedades y Roturas para el Monitor)
exports.obtenerConsolidadoNovedades = async (req, res) => {
    try {
        const novedades = await Novedad.find().sort({ fechaReporte: -1 }).lean();

        const data = novedades.map(n => ({
            _id: n._id,
            tipoDoc: n.tipoRetro === 'Reporte de roturas' ? 'Rotura' : 'Novedad',
            icono: n.tipoRetro === 'Reporte de roturas' ? '🍾' : '🚚',
            cd: n.cd,
            placa: n.placa,
            fecha: n.fechaReporte,
            estado: n.estado || 'Pendiente',
            descripcion: n.tipoRetro === 'Reporte de roturas' 
                ? `${n.unidadesRotas} unds de ${n.materialRotura}`
                : n.comentarios
        }));

        res.json({ exito: true, data });
    } catch (error) {
        res.status(500).json({ exito: false });
    }
};