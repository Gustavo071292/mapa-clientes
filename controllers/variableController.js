const VariableDiaria = require('../models/VariableDiaria');
const VariableMensual = require('../models/VariableMensual');

// Validaciones de Identificador
const validarID = (id) => id && typeof id === 'string' && /^[0-9]+$/.test(id);

// Generador de rango de fechas local
const getRangoMesLocal = (mesStr) => {
    const [year, month] = mesStr.split('-').map(Number);
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 0, 23, 59, 59, 999);
    return { inicio, fin };
};

exports.getMesesDisponibles = async (req, res) => {
    try {
        const { identificador } = req.params;

        if (!validarID(identificador)) {
            return res.status(400).json({ success: false, message: "ID inválido" });
        }

        // 1. Buscar en mensual
        const mesesMensual = await VariableMensual.distinct("mes", { identificador });

        if (mesesMensual.length > 0) {
            return res.json({
                success: true,
                source: "mensual",
                meses: mesesMensual.sort()
            });
        }

        // 2. Fallback: buscar en diaria
        const mesesDiario = await VariableDiaria.aggregate([
            { $match: { identificador } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m", date: "$fecha" }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const meses = mesesDiario.map(m => m._id);

        return res.json({
            success: true,
            source: "diario",
            meses
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error obteniendo meses"
        });
    }
};

exports.getResumenMensual = async (req, res) => {
    try {
        const { identificador } = req.params;
        const { mes } = req.query;

        // Uso de función existente para seguridad
        if (!validarID(identificador) || !mes) {
            return res.status(400).json({ success: false, message: "Cédula o mes no válidos" });
        }

        const oficial = await VariableMensual.findOne({ identificador, mes }).lean();

        if (!oficial) {
            return res.status(404).json({ success: false, message: "No se encontró información oficial." });
        }

        // Formateo de porcentaje para UI
        const porcentajeStr = `${Number(oficial.porcentaje_variable).toFixed(1).replace('.0', '')}%`;

        res.json({
            success: true,
            nombre: oficial.nombre_completo,
            cargo: oficial.cargo,
            cd: oficial.cd,
            pago_variable_dt: oficial.pago_variable_dt,
            salario_variable: oficial.salario_variable,
            porcentaje_variable: porcentajeStr,
            dias_trabajados: oficial.dias_trabajados_total,
            ausencia_justificada: oficial.ausencia_justificada,
            ausencia_injustificada: oficial.ausencia_injustificada
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener resumen." });
    }
};

exports.getDetalleDiario = async (req, res) => {
    try {
        const { identificador } = req.params;
        const { mes, cd } = req.query;

        if (!validarID(identificador) || !mes) return res.status(400).json({ success: false, message: "Datos inválidos" });

        const { inicio, fin } = getRangoMesLocal(mes);
        const matchStage = { identificador, fecha: { $gte: inicio, $lte: fin } };
        if (cd) matchStage.grupo = cd;

        const detalles = await VariableDiaria.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                    monto: { $sum: "$monto_variable_dia" },
                    cumplimiento: { $avg: "$cumplimiento_perc" },
                    rechazos: { $sum: "$rechazos" },
                    ausencias_injustificadas: { $sum: "$ausencias_injustificadas" },
                    dias_trabajados: { $sum: "$dias_trabajados" },
                    asistencia: { $max: "$asistencia" }
                }
            },
            {
                $project: {
                    _id: 1, monto: 1, cumplimiento: { $round: ["$cumplimiento", 2] },
                    rechazos: 1, ausencias_injustificadas: 1, dias_trabajados: 1,
                    asistencia: 1, estado_label: { $cond: ["$asistencia", "Asistió", "Inasistencia"] }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
    success: true,
    count: detalles.length,
    detalles
});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};