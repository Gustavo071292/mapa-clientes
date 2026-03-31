const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * CONTROLADOR DE IA - GERENCIA VALLE
 * Genera sugerencias dinámicas para el análisis de los 5 Porqués
 * basándose en los 11 KPIs críticos de DPO.
 */
exports.generarSugerencia = async (req, res) => {
    // 1. CAPTURA DE DATOS
    const { nivelPorqué, contextoOriginal, indicadorSeleccionado } = req.body;

    // 2. MATRIZ MAESTRA GERENCIA VALLE (Soporte Offline / Contingencia)
    const matrizDPO = {
        "Rechazos": {
            1: ["Cliente cerrado al momento de la llegada", "Zona de difícil acceso reportada por tripulación", "Pedido rechazado por el cliente en puerta"],
            3: ["Falta de pre-llamada de confirmación", "Ruta mal secuenciada que llegó fuera de horario", "Falla en la gestión de re-entrega inmediata"],
            5: ["Ajuste necesario en Ventanas de Servicio", "Rediseño de mallas de ruteo por zona", "Protocolo de rechazos no estandarizado"]
        },
        "Modulación": {
            1: ["No se reportó el estado real del cliente en App", "Falla en la comunicación con T2/Monitoría", "Registro de motivo de rechazo incorrecto"],
            3: ["Tripulación no utilizó el canal de escalación", "Omitido el reporte de cliente cerrado en tiempo real", "Falla en la supervisión de modulación en ruta"],
            5: ["Reentrenamiento en uso de App de reparto", "Mejora en proceso de escalación T2", "Auditoría a reportes de campo vs realidad"]
        },
        "RMD": {
            1: ["Calificación baja por actitud de la tripulación", "Pedido dejado en lugar no adecuado para el cliente", "Demora excesiva en el tiempo de servicio"],
            3: ["Incumplimiento del protocolo de atención al cliente", "Falla en el manejo de objeciones o cobros", "Tripulación no sigue pasos de servicio DPO"],
            5: ["Plan de incentivos basado en calidad de servicio", "Programa de capacitación en servicio al cliente", "Seguimiento crítico a tripulaciones con bajo NPS"]
        },
        "Adherencia a Km": {
            1: ["Desvío de la ruta planeada por la tripulación", "Kilometraje excedido respecto al plan", "Uso de vías alternas no autorizadas"],
            3: ["Falta de seguimiento al plan de ruta digital", "Visita a clientes fuera de la secuencia lógica", "Desvío para actividades no relacionadas con la labor"],
            5: ["Control estricto de geocercas y telemetría", "Ajuste de mallas de ruteo en el sistema", "Disciplina operativa en cumplimiento de ruta"]
        },
        "Adherencia a Tiempo": {
            1: ["Retraso en el ETA (Tiempo estimado de llegada)", "Tiempos muertos prolongados entre clientes", "Inicio de ruta posterior a la hora planeada"],
            3: ["Falla en el cumplimiento de la secuencia cronológica", "Demoras no justificadas en paradas intermedias", "No se sigue el ritmo de entrega del estándar"],
            5: ["Re-dimensionamiento de tiempos de servicio", "Análisis de productividad por tripulación", "Optimización de tiempos de traslado"]
        },
        "PNP": {
            1: ["Parada detectada en sitio no autorizado", "Vehículo detenido sin reporte de novedad", "Pérdida de tiempo en zonas críticas"],
            3: ["Uso de parqueaderos o bahías fuera de ruta", "Parada por motivos personales de la tripulación", "Falla mecánica menor no reportada a monitoría"],
            5: ["Política de paradas autorizadas no socializada", "Refuerzo en monitoreo de GPS en tiempo real", "Plan de seguridad vial y paradas seguras"]
        },
        "Cashless": {
            1: ["Recaudo de efectivo en zona crítica prohibida", "Falla en el uso de billeteras digitales (Daviplata/Nequi)", "Cliente insiste en pagar con efectivo"],
            3: ["Tripulación no validó el estatus Cashless del cliente", "Falta de conocimiento del cliente sobre medios de pago", "Problema de conectividad para pago digital"],
            5: ["Plan de bancarización de clientes críticos", "Comunicación efectiva de política Cashless", "Herramientas digitales de pago más robustas"]
        },
        "TML": {
            1: ["Demora en inspección de Check-list vehicular", "Reunión matinal se extendió más de lo planeado", "Llegada tarde de la tripulación al CD"],
            3: ["No se sigue el estándar de revisión rápida DPO", "Liderazgo no controló el tiempo de la sesión", "Congestión en el proceso de carga en muelle"],
            5: ["Digitalización del proceso de alistamiento", "Reentrenamiento en gestión del tiempo matutino", "Mejora en el flujo de despacho en patio"]
        },
        "TR": {
            1: ["Tráfico pesado en corredores de Gerencia Valle", "Demoras en descargue por volumen elevado", "Ruta con exceso de clientes programados"],
            3: ["Falla en la planeación de ruta dinámica", "No se contemplaron cierres viales conocidos", "Demora excesiva en el primer cliente de ruta"],
            5: ["Rediseño de mallas de ruteo geográfico", "Ajuste de ventanas de servicio y ETAs", "Implementación de alertas de tráfico en tiempo real"]
        },
        "TI": {
            1: ["Fila excesiva para ingreso al CD (Check-in)", "Demora en el proceso administrativo de liquidación", "Espera para descarga de envase vacío"],
            3: ["Proceso manual de arqueo con muchos errores", "Falta de personal en oficina de liquidación", "Desorden en el flujo de parqueo interno"],
            5: ["Automatización del cierre de jornada", "Rediseño del flujo de retorno al CD", "Mejora en tiempos de recepción de envase"]
        },
        "DQI": {
            1: ["Avería detectada durante el descargue en cliente", "Producto llegó golpeado desde el cargue inicial", "Cajas mojadas o con humedad excesiva"],
            3: ["Manipulación brusca por la tripulación", "No se usaron separadores de cartón o plástico", "Estibado incorrecto que permitió movimiento"],
            5: ["Reentrenamiento en estándar de Calidad y Envase", "Inversión en kits de protección de carga", "Auditoría al proceso de cargue en muelle"]
        }
    };

    // 3. FUNCIÓN DE APOYO PARA CONTINGENCIA
    const obtenerRespaldo = (kpi, nivel) => {
        const kpiData = matrizDPO[kpi] || matrizDPO["TML"]; // TML como fallback
        const n = parseInt(nivel);
        if (n >= 5) return kpiData[5];
        if (n >= 3) return kpiData[3];
        return kpiData[1];
    };

    // 4. INTENTO DE GENERACIÓN CON GEMINI 1.5 FLASH
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Actúa como experto DPO Bavaria de la Gerencia Valle. 
        Analiza este incidente: ${contextoOriginal}. 
        KPI afectado: ${indicadorSeleccionado}. 
        Estamos en el nivel ${nivelPorqué} de la metodología de los 5 Porqués. 
        Genera 3 sugerencias técnicas muy breves y profesionales.
        Responde EXCLUSIVAMENTE un arreglo JSON con este formato: ["Opcion 1", "Opcion 2", "Opcion 3"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Limpieza de respuesta para asegurar solo el JSON
        const match = text.match(/\[.*\]/s);
        if (!match) throw new Error("Formato JSON no detectado en la respuesta");
        
        const opciones = JSON.parse(match[0]);
        
        res.status(200).json({ exito: true, opciones });

    } catch (error) {
        console.error("⚠️ Contingencia Activada - Usando Matriz Local:", error.message);
        
        // Si falla la IA, devolvemos los datos de la matriz local según el KPI y nivel
        const opcionesRespaldo = obtenerRespaldo(indicadorSeleccionado, nivelPorqué);
        
        res.status(200).json({ 
            exito: true, 
            opciones: opcionesRespaldo 
        });
    }
};