const Novedad = require('../models/Retro');
const CincoPorques = require('../models/CincoPorques');

// 1. GUARDAR NOVEDAD (Formulario 2.1)
exports.guardarNovedad = async (req, res) => {
    try {
        const { 
            fecha, cedula, cd, placa, codigo_cliente, indicador,
            tipo_retroalimentacion, observacion, categoria, material, unidades 
        } = req.body;

        const nuevaNovedad = new Novedad({
            fechaReporte: fecha || new Date(), 
            cedula, 
            cd, 
            placa,
            codigoCliente: codigo_cliente,
            tipoRetro: tipo_retroalimentacion, 
            indicador: indicador || 'General', 
            comentarios: observacion,
            categoriaRotura: (tipo_retroalimentacion === 'Reporte de roturas') ? categoria : null,
            materialRotura: (tipo_retroalimentacion === 'Reporte de roturas') ? material : null,
            unidadesRotas: (tipo_retroalimentacion === 'Reporte de roturas') ? unidades : 0,
            estado: 'Pendiente'
        });

        await nuevaNovedad.save();
        res.status(200).json({ exito: true, mensaje: "✅ Reporte de ruta guardado correctamente." });
    } catch (error) {
        console.error("❌ Error en guardarNovedad:", error);
        res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// 2. GUARDAR GESTIÓN DÍA ANTERIOR (Formulario 2.2)
exports.guardarCincoPorques = async (req, res) => {
    try {
        const {
            cd, transporte, placa, indicador, descripcion_novedad,
            p1, p2, p3, p4, p5, plan_accion, responsable, fecha_compromiso
        } = req.body;

        const nuevoAnalisis = new CincoPorques({
            cd, 
            transporte, 
            placa, 
            indicador, 
            descripcion_novedad,
            p1, p2, p3, p4, p5,
            causa_raiz: p5, // Mapeo solicitado: causa raíz es el quinto porqué
            plan_accion, 
            responsable,
            fecha_compromiso: fecha_compromiso || new Date(),
            estado: 'Pendiente', 
            fecha_creacion: new Date()
        });

        await nuevoAnalisis.save();
        res.status(200).json({ exito: true, mensaje: "✅ Análisis de 5 Porqués guardado." });
    } catch (error) {
        console.error("❌ Error en guardarCincoPorques:", error);
        res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// 3. OBTENER CONSOLIDADO (Estructura Dashboard 2.3)
exports.obtenerConsolidadoNovedades = async (req, res) => {
    try {
        const [novedades, analisis] = await Promise.all([
            Novedad.find().sort({ fechaReporte: -1 }).lean(),
            CincoPorques.find().sort({ fecha_creacion: -1 }).lean()
        ]);

        const dataNovedades = novedades.map(n => ({
            _id: n._id,
            tipo: (n.tipoRetro === 'Reporte de roturas') ? "Rotura" : "Novedad",
            cd: n.cd,
            identificador: n.placa, 
            fecha: n.fechaReporte,
            estado: n.estado || 'Pendiente',
            descripcion: `${n.indicador || 'General'}: ${n.comentarios || n.materialRotura || 'Sin detalle'}`,
            extra: { 
                fuente: 'Ruta', 
                indicador: n.indicador, 
                responsable: n.cedula, 
                material: n.materialRotura, 
                unidades: n.unidadesRotas,
                codigoCliente: n.codigoCliente,
                tipoRetro: n.tipoRetro,
                historial: n.historialGestion || [] // Enriquecimiento para modal
            }
        }));

        const dataAnalisis = analisis.map(a => ({
            _id: a._id,
            fuente: 'Análisis',
            tipo: '5 Porqués',
            cd: a.cd,
            identificador: a.placa || a.transporte || "SIN PLACA", 
            fecha: a.fecha_creacion,
            estado: a.estado || 'Pendiente',
            descripcion: `${a.indicador || 'Gestión'}: ${a.p1}`,
            extra: { 
                fuente: 'Análisis', 
                indicador: a.indicador, 
                responsable: a.responsable, 
                plan: a.plan_accion,
                causaRaiz: a.causa_raiz,
                transporte: a.transporte,
                historial: a.historialGestion || [] // Enriquecimiento para modal
            }
        }));

        const consolidado = [...dataNovedades, ...dataAnalisis];

        res.json({ 
            exito: true, 
            data: consolidado,
            resumen: {
                totalRuta: dataNovedades.length,
                totalGestion: dataAnalisis.length,
                totalPendientes: consolidado.filter(i => i.estado === 'Pendiente').length
            }
        });
    } catch (error) {
        console.error("❌ Error en obtenerConsolidado:", error);
        res.status(500).json({ exito: false });
    }
};

// 4. GESTIONAR REPORTE (Historial Acumulativo)
exports.gestionarReporte = async (req, res) => {
    try {
        const { id, tipoDoc, nuevoEstado, comentario, usuarioGestion } = req.body;

        if (!id || !nuevoEstado || !comentario || comentario.trim().length < 5) {
            return res.status(400).json({ exito: false, mensaje: "Datos inválidos o comentario muy corto." });
        }

        // Identificar modelo según los tipos permitidos
        const esAnalisis = (tipoDoc === '5 Porqués' || tipoDoc === 'Análisis');
        let Modelo = esAnalisis ? CincoPorques : Novedad;

        const docOriginal = await Modelo.findById(id);
        if (!docOriginal) {
            return res.status(404).json({ exito: false, mensaje: "Registro no encontrado." });
        }

        const gestionEntry = {
            fecha: new Date(),
            estadoAnterior: docOriginal.estado || 'Pendiente',
            estadoNuevo: nuevoEstado,
            comentario: comentario,
            usuarioGestion: usuarioGestion || "Dashboard Ejecutivo"
        };

        const actualizado = await Modelo.findByIdAndUpdate(
            id, 
            { 
                $set: {
                    estado: nuevoEstado, 
                    comentarioGestion: comentario, 
                    fechaGestion: new Date() 
                },
                $push: { historialGestion: gestionEntry }
            },
            { new: true, runValidators: true }
        );

        res.json({ exito: true, mensaje: "✅ Gestión guardada con éxito.", data: actualizado });
    } catch (error) {
        console.error("❌ Error en gestionarReporte:", error);
        res.status(500).json({ exito: false, mensaje: "Error al actualizar en base de datos." });
    }
};