const EjecucionKpi = require('../models/EjecucionKpi');

const YEAR = 2026;

exports.getKpis = async (req, res) => {
    try {
        const { cd, mes, cedula } = req.query;

        if (!cd || !mes || !cedula) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros de consulta: CD, mes o cédula.'
            });
        }

        if (!/^\d{1,2}$/.test(String(mes))) {
            return res.status(400).json({
                success: false,
                message: 'Mes inválido.'
            });
        }

        const mesConsulta = `${YEAR}-${String(mes).padStart(2, '0')}`;

        const registro = await EjecucionKpi.findOne({
            cedula: String(cedula).trim(),
            cd: String(cd).trim().toUpperCase(),
            mes: mesConsulta
        }).lean();

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: `No se encontró información operativa para la cédula ${cedula} en ${cd} (${mesConsulta}).`
            });
        }

        return res.json({
            success: true,
            nombre: registro.nombre_completo,
            tml: {
                valor: `${registro.tml} min`,
                clase: registro.tml < 60 ? 'status-ok' : 'status-critical'
            },
            tr: {
                valor: `${registro.tr} h`,
                clase: registro.tr < 10 ? 'status-ok' : 'status-critical'
            },
            tv: {
                valor: `${registro.tv} min`,
                clase: registro.tv < 30 ? 'status-ok' : 'status-critical'
            },
            roturas: {
                valor: `${registro.roturas} und`,
                clase: ''
            },
            excesos_jl: {
                valor: `${registro.excesos_jl} ${registro.excesos_jl === 1 ? 'vez' : 'veces'}`,
                clase: registro.excesos_jl < 2 ? 'status-ok' : 'status-critical'
            }
        });

    } catch (error) {
        console.error('Error en getKpis:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al consultar KPIs.'
        });
    }
};

exports.getHistorico = async (req, res) => {
    try {
        const { cd, cedula } = req.query;

        if (!cd || !cedula) {
            return res.status(400).json({
                success: false,
                message: 'CD y cédula son obligatorios para consultar el histórico.'
            });
        }

        const historico = await EjecucionKpi.find({
            cedula: String(cedula).trim(),
            cd: String(cd).trim().toUpperCase()
        })
            .select('mes tml tr tv roturas excesos_jl -_id')
            .sort({ mes: 1 })
            .lean();

        if (!historico.length) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró historial para este colaborador.'
            });
        }

        return res.json({
            success: true,
            data: historico
        });

    } catch (error) {
        console.error('Error en getHistorico:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al consultar histórico.'
        });
    }
};