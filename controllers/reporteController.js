/**
 * CONTROLADOR DE REPORTES - GERENCIA VALLE
 * Maneja: 
 * 1. Reporte de Ruta (2.1)
 * 2. Gestión Día Anterior - 5 Porqués (2.2)
 * 3. Consolidado para Dashboard y Auditoría (2.3)
 */

const Novedad = require('../models/Retro'); 
const CincoPorques = require('../models/CincoPorques'); 

// 1. GUARDAR NOVEDAD (Formulario 2.1 - Pre/En/Post Ruta y Roturas)
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

// 2. GUARDAR GESTIÓN DÍA ANTERIOR (Formulario 2.2 - Análisis 5 Porqués)
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
            causa_raiz: p5,
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

// 3. OBTENER CONSOLIDADO (Estructura optimizada para Dashboard, Pareto y Excel)
exports.obtenerConsolidadoNovedades = async (req, res) => {
    try {
        const [novedades, analisis] = await Promise.all([
            Novedad.find().sort({ fechaReporte: -1 }).lean(),
            CincoPorques.find().sort({ fecha_creacion: -1 }).lean()
        ]);

        // Mapeo de Novedades de Ruta (2.1)
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
                codigoCliente: n.codigoCliente
            }
        }));

        // Mapeo de Análisis 5 Porqués (2.2) - CORREGIDO PARA USAR PLACA
        const dataAnalisis = analisis.map(a => ({
            _id: a._id,
            fuente: 'Análisis',
            tipo: '5 Porqués',
            cd: a.cd,
            // AJUSTE: Se prioriza 'placa' sobre 'transporte' para unificar el Dashboard
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
                transporte: a.transporte // Se guarda el transporte internamente por si se requiere
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

// 4. GESTIONAR REPORTE (Actualización de estados desde el Dashboard)
exports.gestionarReporte = async (req, res) => {
    try {
        const { id, tipoDoc, nuevoEstado, comentario } = req.body;
        
        console.log(`Intentando actualizar ID: ${id} | Tipo: ${tipoDoc} | Estado: ${nuevoEstado}`);

        let Modelo = (tipoDoc === '5 Porqués' || tipoDoc === 'Análisis') ? CincoPorques : Novedad;

        const actualizado = await Modelo.findByIdAndUpdate(
            id, 
            { 
                estado: nuevoEstado, 
                comentarioGestion: comentario, 
                fechaGestion: new Date() 
            },
            { new: true, runValidators: true }
        );

        if (!actualizado) {
            return res.status(404).json({ exito: false, mensaje: "Registro no encontrado." });
        }

        res.json({ exito: true, mensaje: "✅ Gestión guardada con éxito." });
    } catch (error) {
        console.error("❌ Error en gestionarReporte:", error);
        res.status(500).json({ exito: false, mensaje: "Error al actualizar en base de datos." });
    }
};