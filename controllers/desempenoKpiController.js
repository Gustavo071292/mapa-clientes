const DesempenoKpi = require('../models/DesempenoKpi');
const KpiConfig = require('../models/KpiConfig');

/**
 * Helper: identifica el nombre correcto según la cédula consultada.
 * Soporta conductor, responsable de ruta y auxiliares.
 */
const getNombreColaborador = (registro, cedulaClean) => {
    if (!registro) return 'Sin nombre';

    if (registro.cc_conductor === cedulaClean) {
        return registro.nombre_conductor || 'Sin nombre';
    }

    if (registro.cc_responsable_ruta === cedulaClean) {
        return registro.nombre_responsable_ruta || 'Sin nombre';
    }

    if (registro.cc_auxiliar_1 === cedulaClean || registro.cc_auxiliar_2 === cedulaClean) {
        return registro.nombre_auxiliar_reparto || 'Sin nombre';
    }

    return (
        registro.nombre_conductor ||
        registro.nombre_responsable_ruta ||
        registro.nombre_auxiliar_reparto ||
        'Sin nombre'
    );
};

/**
 * Helper: filtro de búsqueda por cualquier integrante de la tripulación.
 */
const buildCedulaTripulacionFilter = (cedulaClean) => ([
    { cc_conductor: cedulaClean },
    { cc_responsable_ruta: cedulaClean },
    { cc_auxiliar_1: cedulaClean },
    { cc_auxiliar_2: cedulaClean }
]);

// GET /api/desempeno-kpi/consulta (DIARIO)
exports.getDesempenoKpi = async (req, res) => {
    try {
        const { cd, fecha, cedula } = req.query;

        if (!cd || !fecha || !cedula) {
            return res.status(400).json({
                success: false,
                message: "Faltan parámetros: cd, fecha o cedula."
            });
        }

        const cedulaClean = String(cedula).trim();

        const registro = await DesempenoKpi.findOne({
            cd: String(cd).trim().toUpperCase(),
            fecha,
            $or: buildCedulaTripulacionFilter(cedulaClean)
        }).lean();

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: "No hay datos."
            });
        }

        const configs = await KpiConfig.find().sort({ createdAt: 1 }).lean();

        const tabla = configs
            .filter(c => c.aplicabilidad.includes(registro.cd))
            .map(c => {
                const valor = registro[c.mongo_field];

                return {
                    kpi_impactado: c.kpi_impactado,
                    indicador_pi: c.indicador_pi,
                    unidad: c.unidad,
                    meta: exports.formatValueByConfig(c.meta, c.display_format),
                    disparador: exports.formatValueByConfig(c.disparador, c.display_format),
                    herramienta: c.herramienta_gestion,
                    resultado_display: exports.formatResultado(c, registro, valor),
                    evaluacion: exports.evaluateKpiStatus(c, valor, registro, cedulaClean)
                };
            });

        res.json({
            success: true,
            header: {
                nombre: getNombreColaborador(registro, cedulaClean),
                placa: registro.placa,
                transporte: registro.transporte,
                cd: registro.cd,
                fecha: registro.fecha,
                cedula: cedulaClean
            },
            tabla_desempeno: tabla
        });

    } catch (e) {
        console.error("Error getDesempenoKpi:", e);
        res.status(500).json({
            success: false,
            message: "Error interno consultando desempeño diario."
        });
    }
};

// GET /api/desempeno-kpi/semanal
exports.getDesempenoKpiSemanal = async (req, res) => {
    try {
        const { cd, semana, anio, cedula } = req.query;

        if (!cd || !semana || !anio || !cedula) {
            return res.status(400).json({
                success: false,
                message: "Faltan parámetros: cd, semana, anio o cedula."
            });
        }

        const cedulaClean = String(cedula).trim();

        const registros = await DesempenoKpi.find({
            cd: String(cd).trim().toUpperCase(),
            semana: parseInt(semana, 10),
            anio: parseInt(anio, 10),
            $or: buildCedulaTripulacionFilter(cedulaClean)
        }).sort({ fecha: 1 }).lean();

        if (registros.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sin datos para la semana."
            });
        }

        const diasMap = new Map();

        registros.forEach(r => {
            if (!diasMap.has(r.fecha)) {
                diasMap.set(r.fecha, {
                    fecha: r.fecha,
                    label: exports.formatDayLabelSecure(r.fecha)
                });
            }
        });

        const diasConfig = Array.from(diasMap.values());

        const configs = await KpiConfig.find().sort({ createdAt: 1 }).lean();

        const tabla = configs
            .filter(conf => conf.aplicabilidad.includes(registros[0].cd))
            .map(conf => {
                return {
                    kpi_impactado: conf.kpi_impactado,
                    indicador_pi: conf.indicador_pi,
                    unidad: conf.unidad,
                    meta: exports.formatValueByConfig(conf.meta, conf.display_format),
                    disparador: exports.formatValueByConfig(conf.disparador, conf.display_format),
                    herramienta: conf.herramienta_gestion,

                    resultados: diasConfig.map(dia => {
                        const regDia = registros.find(r => r.fecha === dia.fecha);
                        const valor = regDia ? regDia[conf.mongo_field] : null;

                        return {
                            fecha: dia.fecha,
                            resultado_display: regDia
                                ? exports.formatResultado(conf, regDia, valor)
                                : "—",
                            evaluacion: regDia
                                ? exports.evaluateKpiStatus(conf, valor, regDia, cedulaClean)
                                : {
                                    estado: "neutral",
                                    gestion_activa: false,
                                    url: null
                                }
                        };
                    })
                };
            });

        res.json({
            success: true,
            header: {
                nombre: getNombreColaborador(registros[0], cedulaClean),
                placa: registros[0].placa,
                transporte: registros[0].transporte,
                cd: registros[0].cd,
                semana: parseInt(semana, 10),
                anio: parseInt(anio, 10),
                cedula: cedulaClean
            },
            dias: diasConfig,
            tabla_desempeno: tabla
        });

    } catch (e) {
        console.error("Error getDesempenoKpiSemanal:", e);
        res.status(500).json({
            success: false,
            message: "Error interno consultando desempeño semanal."
        });
    }
};

// HELPERS
exports.evaluateKpiStatus = (config, valor, registro, cedulaClean) => {
    if (valor === null || valor === undefined) {
        return {
            estado: "neutral",
            gestion_activa: false,
            url: null
        };
    }

    const { meta, disparador, direccion_logica } = config;
    let estado = "success";

    if (direccion_logica === "MENOR_ES_MEJOR") {
        if (valor >= disparador) {
            estado = "triggered";
        } else if (valor > meta) {
            estado = "warning";
        }
    } else {
        if (valor <= disparador) {
            estado = "triggered";
        } else if (valor < meta) {
            estado = "warning";
        }
    }

    return {
        estado,
        gestion_activa: estado === "triggered",
        url: estado === "triggered"
            ? exports.buildGestionUrl(cedulaClean, registro, config, valor)
            : null
    };
};

exports.buildGestionUrl = (cedula, reg, config, valor) => {
    const params = new URLSearchParams({
        cedula,
        fecha: reg.fecha,
        cd: reg.cd,
        indicador: config.indicador_pi,
        valor,
        source: "dashboard_1.1"
    });

    return `/equipos-empoderados/retro/cinco-porques?${params.toString()}`;
};

exports.formatResultado = (conf, reg, valor) => {
    if (valor === null || valor === undefined) return "—";

    if (conf.display_format === "HH_MM") {
        return reg[`${conf.mongo_field}_label`] || "--:--";
    }

    return exports.formatValueByConfig(valor, conf.display_format);
};

exports.formatValueByConfig = (val, format) => {
    if (val === null || val === undefined) return "—";

    if (format === "PERCENT") {
        return `${val}%`;
    }

    if (format === "HH_MM") {
        const h = Math.floor(val / 60);
        const m = val % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    return val;
};

exports.formatDayLabelSecure = (fechaStr) => {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    return `${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
};

exports.getKpiConfig = async (req, res) => {
    try {
        const configs = await KpiConfig.find().lean();

        res.json({
            success: true,
            configs
        });

    } catch (e) {
        console.error("Error getKpiConfig:", e);

        res.status(500).json({
            success: false,
            message: "Error interno consultando configuración KPI."
        });
    }
};