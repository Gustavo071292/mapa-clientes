const Novedad = require('../models/Retro'); 
const CincoPorques = require('../models/CincoPorques');

// 1. GUARDAR NOVEDADES (Funcionando OK)
exports.guardarNovedad = async (req, res) => {
    try {
        const { fecha, cedula, cd, placa, codigo_cliente, tipo_retroalimentacion, observacion } = req.body;
        
        const nuevaNovedad = new Novedad({
            fechaReporte: fecha, 
            cedula: cedula,
            cd: cd,
            placa: placa,
            codigoCliente: codigo_cliente,
            tipoRetro: tipo_retroalimentacion,
            comentarios: observacion,
            estado: 'Pendiente'
        });

        await nuevaNovedad.save();
        res.status(200).json({ exito: true, mensaje: "✅ Novedad guardada correctamente en Atlas." });
    } catch (error) {
        console.error("❌ Error en Novedades:", error);
        res.status(500).json({ exito: false, mensaje: "Error de validación en Atlas." });
    }
};

// 2. GUARDAR 5 PORQUÉS (Corregido para evitar "Error Crítico")
exports.guardarAnalisisDPO = async (req, res) => {
    try {
        // Mapeamos los campos exactamente como los envía tu formulario de Cali
        const nuevoAnalisis = new CincoPorques({
            cd: req.body.cd,
            cedula: req.body.cedula,
            placa: req.body.placa,
            indicador: req.body.indicador,
            descripcion_novedad: req.body.descripcion_novedad,
            porques: req.body.porques || [], // Array de las respuestas
            causa_raiz: req.body.causa_raiz,
            plan_accion: req.body.plan_accion,
            responsable: req.body.responsable,
            fecha_compromiso: req.body.fecha_compromiso,
            estado: 'Pendiente',
            fecha_creacion: new Date()
        });

        await nuevoAnalisis.save();
        
        res.status(200).json({ 
            exito: true, 
            mensaje: "✅ Análisis DPO guardado exitosamente en Atlas." 
        });

    } catch (error) {
        console.error("❌ Error de guardado DPO en Atlas:", error);
        res.status(500).json({ 
            exito: false, 
            mensaje: "Error crítico de conexión: Verifica que todos los campos estén llenos." 
        });
    }
};

// 3. OBTENER DATOS PARA EL DASHBOARD (Consolidado)
exports.obtenerConsolidadoValle = async (req, res) => {
    try {
        const [novedades, porques] = await Promise.all([
            Novedad.find().lean(),
            CincoPorques.find().lean()
        ]);

        const data = [
            ...novedades.map(n => ({
                _id: n._id,
                tipoDoc: 'Novedad',
                icono: '🚚',
                cd: n.cd,
                placa: n.placa,
                fecha: n.fechaReporte,
                estado: n.estado || 'Pendiente',
                // CAMBIO AQUÍ: Usamos 'comentarios' que es como lo definiste en el modelo Retro
                descripcion: n.comentarios || 'Sin observación' 
            })),
            ...porques.map(p => ({
                _id: p._id,
                tipoDoc: '5 Porqués',
                icono: '🤝',
                cd: p.cd,
                placa: p.placa,
                fecha: p.fecha_creacion,
                estado: p.estado || 'Pendiente',
                // CAMBIO AQUÍ: Concatenamos causa y plan para que no salga undefined
                descripcion: `Causa: ${p.causa_raiz || 'Pendiente'} | Plan: ${p.plan_accion || 'Pendiente'}`
            }))
        ];

        res.json({ exito: true, data });
    } catch (error) {
        res.status(500).json({ exito: false });
    }
};

// 4. GESTIONAR ESTADO (Desde el Monitor Gerencial)
exports.actualizarEstadoReporte = async (req, res) => {
    try {
        const { id, tipoDoc, nuevoEstado, comentario } = req.body;
        const Modelo = (tipoDoc === 'Novedad') ? Novedad : CincoPorques;
        
        await Modelo.findByIdAndUpdate(id, { 
            estado: nuevoEstado, 
            comentario_gestion: comentario 
        });

        res.json({ exito: true, mensaje: "Estado actualizado." });
    } catch (error) {
        console.error("❌ Error al actualizar:", error);
        res.status(500).json({ exito: false });
    }
};