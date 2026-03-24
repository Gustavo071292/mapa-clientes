const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generarSugerencia = async (req, res) => {
    // 1. CAPTURA DE DATOS
    const { nivelPorqué, contextoOriginal, indicadorSeleccionado } = req.body;
    
    // 2. MATRIZ MAESTRA GERENCIA VALLE (11 KPIs)
    const matrizDPO = {
        "Rechazos": {
            1: ["Cliente cerrado al momento de la llegada", "Zona de difícil acceso reportada por tripulación", "Pedido rechazado por el cliente en puerta"],
            3: ["Falta de pre-llamada de confirmación", "Ruta mal secuenciada que llegó fuera de horario", "Falla en la gestión de re-entrega inmediata"],
            5: ["Causa Raíz: Ajuste necesario en Ventanas de Servicio", "Causa Raíz: Rediseño de mallas de ruteo por zona", "Causa Raíz: Protocolo de rechazos no estandarizado"]
        },
        "Modulación": {
            1: ["No se reportó el estado real del cliente en App", "Falla en la comunicación con T2/Monitoría", "Registro de motivo de rechazo incorrecto"],
            3: ["Tripulación no utilizó el canal de escalación", "Omitido el reporte de cliente cerrado en tiempo real", "Falla en la supervisión de modulación en ruta"],
            5: ["Causa Raíz: Reentrenamiento en uso de App de reparto", "Causa Raíz: Mejora en proceso de escalación T2", "Causa Raíz: Auditoría a reportes de campo vs realidad"]
        },
        "RMD": {
            1: ["Calificación baja por actitud de la tripulación", "Pedido dejado en lugar no adecuado para el cliente", "Demora excesiva en el tiempo de servicio"],
            3: ["Incumplimiento del protocolo de atención al cliente", "Falla en el manejo de objeciones o cobros", "Tripulación no sigue pasos de servicio DPO"],
            5: ["Causa Raíz: Plan de incentivos basado en calidad de servicio", "Causa Raíz: Programa de capacitación en servicio al cliente", "Causa Raíz: Seguimiento crítico a tripulaciones con bajo NPS"]
        },
        "Adherencia a Km": {
            1: ["Desvío de la ruta planeada por la tripulación", "Kilometraje excedido respecto al plan", "Uso de vías alternas no autorizadas"],
            3: ["Falta de seguimiento al plan de ruta digital", "Visita a clientes fuera de la secuencia lógica", "Desvío para actividades no relacionadas con la labor"],
            5: ["Causa Raíz: Control estricto de geocercas y telemetría", "Causa Raíz: Ajuste de mallas de ruteo en el sistema", "Causa Raíz: Disciplina operativa en cumplimiento de ruta"]
        },
        "Adherencia a Tiempo": {
            1: ["Retraso en el ETA (Tiempo estimado de llegada)", "Tiempos muertos prolongados entre clientes", "Inicio de ruta posterior a la hora planeada"],
            3: ["Falla en el cumplimiento de la secuencia cronológica", "Demoras no justificadas en paradas intermedias", "No se sigue el ritmo de entrega del estándar"],
            5: ["Causa Raíz: Re-dimensionamiento de tiempos de servicio", "Causa Raíz: Análisis de productividad por tripulación", "Causa Raíz: Optimización de tiempos de traslado"]
        },
        "PNP": {
            1: ["Parada detectada en sitio no autorizado", "Vehículo detenido sin reporte de novedad", "Pérdida de tiempo en zonas críticas"],
            3: ["Uso de parqueaderos o bahías fuera de ruta", "Parada por motivos personales de la tripulación", "Falla mecánica menor no reportada a monitoría"],
            5: ["Causa Raíz: Política de paradas autorizadas no socializada", "Causa Raíz: Refuerzo en monitoreo de GPS en tiempo real", "Causa Raíz: Plan de seguridad vial y paradas seguras"]
        },
        "Cashless": {
            1: ["Recaudo de efectivo en zona crítica prohibida", "Falla en el uso de billeteras digitales (Daviplata/Nequi)", "Cliente insiste en pagar con efectivo"],
            3: ["Tripulación no validó el estatus Cashless del cliente", "Falta de conocimiento del cliente sobre medios de pago", "Problema de conectividad para pago digital"],
            5: ["Causa Raíz: Plan de bancarización de clientes críticos", "Causa Raíz: Comunicación efectiva de política Cashless", "Causa Raíz: Herramientas digitales de pago más robustas"]
        },
        "TML": {
            1: ["Demora en inspección de Check-list vehicular", "Reunión matinal se extendió más de lo planeado", "Llegada tarde de la tripulación al CD"],
            3: ["No se sigue el estándar de revisión rápida DPO", "Liderazgo no controló el tiempo de la sesión", "Congestión en el proceso de carga en muelle"],
            5: ["Causa Raíz: Digitalización del proceso de alistamiento", "Causa Raíz: Reentrenamiento en gestión del tiempo matutino", "Causa Raíz: Mejora en el flujo de despacho en patio"]
        },
        "TR": {
            1: ["Tráfico pesado en corredores de Gerencia Valle", "Demoras en descargue por volumen elevado", "Ruta con exceso de clientes programados"],
            3: ["Falla en la planeación de ruta dinámica", "No se contemplaron cierres viales conocidos", "Demora excesiva en el primer cliente de ruta"],
            5: ["Causa Raíz: Rediseño de mallas de ruteo geográfico", "Causa Raíz: Ajuste de ventanas de servicio y ETAs", "Causa Raíz: Implementación de alertas de tráfico en tiempo real"]
        },
        "TI": {
            1: ["Fila excesiva para ingreso al CD (Check-in)", "Demora en el proceso administrativo de liquidación", "Espera para descarga de envase vacío"],
            3: ["Proceso manual de arqueo con muchos errores", "Falta de personal en oficina de liquidación", "Desorden en el flujo de parqueo interno"],
            5: ["Causa Raíz: Automatización del cierre de jornada", "Causa Raíz: Rediseño del flujo de retorno al CD", "Causa Raíz: Mejora en tiempos de recepción de envase"]
        },
        "DQI": {
            1: ["Avería detectada durante el descargue en cliente", "Producto llegó golpeado desde el cargue inicial", "Cajas mojadas o con humedad excesiva"],
            3: ["Manipulación brusca por la tripulación", "No se usaron separadores de cartón o plástico", "Estibado incorrecto que permitió movimiento"],
            5: ["Causa Raíz: Reentrenamiento en estándar de Calidad y Envase", "Causa Raíz: Inversión en kits de protección de carga", "Causa Raíz: Auditoría al proceso de cargue en muelle"]
        }
    };

    // 3. LÓGICA DE RESPALDO (Soporte si falla la IA)
    const obtenerRespaldo = (kpi, nivel) => {
        const kpiData = matrizDPO[kpi] || matrizDPO["TML"]; 
        const n = parseInt(nivel);
        if (n >= 5) return kpiData[5];
        if (n >= 3) return kpiData[3];
        return kpiData[1];
    };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Mejoramos el prompt para que Gemini no devuelva texto basura
        const prompt = `Actúa como experto DPO Bavaria. 
        Analiza este incidente: ${contextoOriginal}. 
        KPI afectado: ${indicadorSeleccionado}. 
        Estamos en el nivel ${nivelPorqué} de los 5 Porqués. 
        Genera 3 sugerencias técnicas breves.
        Responde EXCLUSIVAMENTE un JSON con este formato: ["Opcion 1", "Opcion 2", "Opcion 3"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Limpieza de JSON mejorada con Regex por seguridad
        const match = text.match(/\[.*\]/s);
        if (!match) throw new Error("Formato JSON no encontrado");
        
        const opciones = JSON.parse(match[0]);
        
        res.status(200).json({ exito: true, opciones });

    } catch (error) {
        console.error("⚠️ Usando Contingencia Gerencia Valle:", error.message);
        
        const opcionesRespaldo = obtenerRespaldo(indicadorSeleccionado, nivelPorqué);
        
        res.status(200).json({ 
            exito: true, 
            opciones: opcionesRespaldo 
        });
    }
};