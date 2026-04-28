const Rta = require('../models/Rta');

const rtaController = {
    // Guardar un nuevo reporte RTA con mapeo explícito y fecha de gestión
    guardarRTA: async (req, res) => {
        try {
            const data = req.body;

            const rtaMapeado = new Rta({
                // CONTEXTO
                fechaHallazgo: data.fecha,
                ejecutor: data.ejecutor,
                negocio: data.negocio,
                cd: data.cd,
                equipo: data.equipo,
                tipoAnomalia: data.tipo_anomalia,
                tipoEvento: data.naturaleza_anomalia,
                kpi: data.kpi,

                // DESCRIPCIÓN
                descripcionAnomalia: data.desc_anomalia,
                descripcionProblema: data.desc_problema,
                queDetecto: data.que_detecto,
                cuandoDetecto: data.cuando_detecto,
                dondeDetecto: data.donde_detecto,
                quienDetecto: data.quien_detecto,
                quienIntervino: data.quien_intervino,

                // VALIDACIÓN OPERATIVA
                punto1: data.punto_1,
                resultado1: data.resultado_1,
                accion1: data.accion_1,

                punto2: data.punto_2,
                resultado2: data.resultado_2,
                accion2: data.accion_2,

                punto3: data.punto_3,
                resultado3: data.resultado_3,
                accion3: data.accion_3,

                // SOP
                sopDisponible: data.sop_disponible,
                sopAplicable: data.sop_aplicable,
                sopRevisar: data.sop_revisar,
                sopCapacitacion: data.sop_capacitacion,
                sopImplementado: data.sop_implementado,
                reincidencia: data.reincidencia,

                // ANÁLISIS 5 PORQUÉS
                porQue1: data.por_que_1,
                porQue2: data.por_que_2,
                porQue3: data.por_que_3,
                porQue4: data.por_que_4,
                porQue5: data.por_que_5,
                causaRaiz: data.causa_raiz,

                // PLAN DE ACCIÓN
                planAccion1: data.plan_accion,
                responsable1: data.responsable_accion,
                fechaCierre1: data.fecha_compromiso,

                // GESTIÓN Y CLASIFICACIÓN
                estado: data.estado_rta,
                prioridad: data.prioridad_rta,
                comentarioGestion: data.comentario_gestion || "",
                fechaGestion: data.fecha_gestion || null
            });

            await rtaMapeado.save();

            res.json({
                exito: true,
                mensaje: "RTA guardado correctamente"
            });

        } catch (error) {
            res.status(500).json({
                exito: false,
                mensaje: error.message
            });
        }
    },

    // Listar reportes RTA
    listarRTA: async (req, res) => {
        try {
            const listado = await Rta.find().sort({ fecha_creacion: -1 });

            res.json({
                exito: true,
                data: listado
            });

        } catch (error) {
            res.status(500).json({
                exito: false,
                mensaje: error.message
            });
        }
    },

    // Actualizar estado y guardar comentario de gestión
    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { nuevoEstado, comentario } = req.body;

            const estadosValidos = ['Pendiente', 'En Proceso', 'Realizado', 'Cerrado'];

            if (!nuevoEstado || !comentario || comentario.trim() === "") {
                return res.status(400).json({
                    exito: false,
                    mensaje: "El estado y el comentario son obligatorios."
                });
            }

            if (!estadosValidos.includes(nuevoEstado)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: "Estado no válido."
                });
            }

            const rta = await Rta.findById(id);

            if (!rta) {
                return res.status(404).json({
                    exito: false,
                    mensaje: "El reporte RTA no existe."
                });
            }

            const historial = {
                texto: comentario.trim(),
                estadoAnterior: rta.estado,
                estadoNuevo: nuevoEstado,
                fecha: new Date()
            };

            rta.estado = nuevoEstado;
            rta.comentarioGestion = comentario.trim();
            rta.fechaGestion = new Date();

            if (!Array.isArray(rta.comentarios)) {
                rta.comentarios = [];
            }

            rta.comentarios.push(historial);

            await rta.save();

            res.json({
                exito: true,
                mensaje: "Gestión actualizada exitosamente.",
                data: rta
            });

        } catch (error) {
            res.status(500).json({
                exito: false,
                mensaje: error.message
            });
        }
    }
};

module.exports = rtaController;