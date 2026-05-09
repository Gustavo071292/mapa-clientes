const DesempenoKpi = require('../models/DesempenoKpi');
const KpiConfig = require('../models/KpiConfig');

/**
 * Consulta Principal: Obtiene el desempeño diario cruzado con metas
 */
exports.getDesempenoKpi = async (req, res) => {
    try {
        const { cd, fecha, cedula } = req.query;

        if (!cd || !fecha || !cedula) {
            return res.status(400).json({ 
                success: false, 
                message: "Parámetros obligatorios faltantes: cd, fecha y cedula." 
            });
        }

        // QA: Normalización de cédula para toda la lógica de búsqueda y links
        const cedulaClean = String(cedula).trim();

        const registro = await DesempenoKpi.findOne({
            cd: String(cd).toUpperCase(),
            fecha: fecha,
            $or: [
                { cc_conductor: cedulaClean },
                { cc_responsable_ruta: cedulaClean }
            ]
        }).lean();

        if (!registro) {
            return res.status(404).json({ 
                success: false, 
                message: `No se encontró registro para la cédula ${cedulaClean} en la fecha ${fecha}.` 
            });
        }

        // Obtener configuración ordenada por creación (orden del seed)
        const configs = await KpiConfig.find().sort({ createdAt: 1 }).lean();

        const tabla_desempeno = configs
            .filter(conf => conf.aplicabilidad.includes(registro.cd))
            .map(conf => {
                const fieldKey = conf.mongo_field;
                const valorReal = registro[fieldKey];

                return {
                    kpi_impactado: conf.kpi_impactado,
                    indicador_pi: conf.indicador_pi,
                    unidad: conf.unidad,
                    meta: formatValueByConfig(conf.meta, conf.display_format),
                    disparador: formatValueByConfig(conf.disparador, conf.display_format),
                    resultado_display: formatResultado(conf, registro, valorReal),
                    evaluacion: evaluateKpiStatus(conf, valorReal, registro, cedulaClean)
                };
            });

        res.json({
            success: true,
            header: {
                nombre: registro.cc_conductor === cedulaClean ? registro.nombre_conductor : registro.nombre_responsable_ruta,
                placa: registro.placa,
                transporte: registro.transporte,
                cd: registro.cd,
                fecha: registro.fecha,
                cedula: cedulaClean
            },
            tabla_desempeno
        });

    } catch (error) {
        console.error("Error en getDesempenoKpi:", error);
        res.status(500).json({ success: false, message: "Error interno en el servidor operativo." });
    }
};

/**
 * Endpoint para obtener la matriz de configuración
 */
exports.getKpiConfig = async (req, res) => {
    try {
        const configs = await KpiConfig.find().sort({ createdAt: 1 }).lean();
        res.json({ success: true, data: configs });
    } catch (error) {
        console.error("Error en getKpiConfig:", error);
        res.status(500).json({ success: false, message: "Error al obtener configuración." });
    }
};

/**
 * HELPER: Motor de Evaluación de Estados (Lógica 1.1)
 */
function evaluateKpiStatus(config, valor, registro, cedulaClean) {
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
        if (valor >= disparador) estado = "triggered";
        else if (valor > meta) estado = "warning";
    } else {
        // MAYOR_ES_MEJOR
        if (valor <= disparador) estado = "triggered";
        else if (valor < meta) estado = "warning";
    }

    return {
        estado,
        gestion_activa: estado === "triggered",
        url: estado === "triggered" ? buildGestionUrl(cedulaClean, registro, config, valor) : null
    };
}

/**
 * HELPER: Construcción de URL para Módulo 2.2
 */
function buildGestionUrl(cedulaClean, registro, config, valor) {
    const params = new URLSearchParams({
        cedula: cedulaClean,
        fecha: registro.fecha,
        cd: registro.cd,
        indicador: config.indicador_pi,
        valor: valor,
        source: "dashboard_1.1"
    });
    return `/equipos-empoderados/retro/cinco-porques?${params.toString()}`;
}

/**
 * HELPER: Formateo de Resultados basado en Configuración
 */
function formatResultado(conf, registro, valor) {
    if (valor === null || valor === undefined) return "Sin dato";
    
    // Si es formato hora, usamos el label guardado en el importador
    if (conf.display_format === "HH_MM") {
        const labelKey = `${conf.mongo_field}_label`;
        return registro[labelKey] || "--:--";
    }
    
    return formatValueByConfig(valor, conf.display_format);
}

/**
 * HELPER: Conversión de valores numéricos a etiquetas legibles
 */
function formatValueByConfig(val, format) {
    if (val === null || val === undefined) return "--";
    
    if (format === "PERCENT") return `${val}%`;
    
    if (format === "HH_MM") {
        const hrs = Math.floor(val / 60);
        const mins = val % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    
    return val;
}