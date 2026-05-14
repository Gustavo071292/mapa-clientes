/**
 * CONTROLADOR DE IA SIMULADA - GERENCIA VALLE
 * Arquitectura 100% Local y Estable.
 * Elimina dependencias externas para evitar errores de conexión.
 */

// 1. MATRIZ MAESTRA OPERATIVA (5 Niveles x 4 Opciones Únicas)
const matrizDPO = {
    "Rechazos": {
        1: ["Cliente cerrado al momento de la llegada por falta de coordinación previa", "Zona de difícil acceso no identificada en el mapeo de rutas", "Cliente no ubicado por falta de verificación de dirección en sistema", "Inexistencia de horarios de entrega actualizados y flexibles"],
        2: ["Falta de protocolo de pre-llamada de confirmación por el responsable", "Ruta mal secuenciada con llegada fuera de ventanas de servicio", "Falla en el proceso definido de gestión de re-entrega inmediata", "Ausencia de registro sistemático de llamadas en el sistema operativo"],
        3: ["Falta de revisión periódica y feedback de tripulación sobre ventanas", "Mallas de ruteo por zona desactualizadas con datos recientes", "Protocolo de rechazos no estandarizado ni auditado en campo", "Inexistencia de manual operativo y capacitación técnica a tripulaciones"],
        4: ["Falla en canal directo de comunicación con monitoría en tiempo real", "Registro incorrecto del motivo de rechazo por falta de validación", "Omisión de reporte de estado real y evidencia fotográfica en App", "Ausencia de alertas documentadas sobre incidencias de ruteo"],
        5: ["Falta de auditoría sistemática de reportes de campo vs realidad", "Inexistencia de sesiones regulares de reentrenamiento en App de reparto", "Deficiencia en el flujo de escalación T2 y medición de respuesta", "Carencia de incentivos a la transparencia y mejora continua"]
    },
    "Modulación": {
        1: ["No se reportó el estado real del cliente por falta de formación técnica", "Registro de motivo de rechazo incorrecto por falta de opciones claras", "Falla en protocolo de contacto con T2/Monitoría por falta de responsable", "Omisión de revisión del reporte antes del envío final de la ruta"],
        2: ["Tripulación desconoce el canal de escalación disponible en campo", "Omisión de reporte de cliente cerrado en tiempo real por falta de alertas", "Falla en supervisión de modulación por falta de responsables claros", "Inexistencia de penalización por omisión de reportes inmediatos"],
        3: ["Contenidos de reentrenamiento en App de reparto desactualizados", "Auditoría de reportes de campo no realizada de forma sistemática", "Flujo de trabajo de escalación T2 no definido operativamente", "Falta de comunicación de resultados y hallazgos a la tripulación"],
        4: ["Carencia de herramientas de monitoreo de modulación en vivo", "Asignación ineficiente de supervisores de modulación por zona operativa", "Secuencia de entregas no revisada durante la ejecución de la ruta", "Falta de formación técnica específica sobre canales de escalación"],
        5: ["Falta de comparación de información entre reporte y realidad operativa", "Medición de satisfacción del cliente y efectividad de escalación omitida", "Métodos de reentrenamiento no adaptados a la mejora continua", "Protocolos de escalación no ajustados según resultados críticos"]
    },
    "RMD": {
        1: ["Calificación baja por falta de formación en servicio al cliente", "Pedido dejado en lugar no adecuado sin verificar preferencia", "Demora excesiva en tiempo de servicio por falta de control", "Inexistencia de incentivos para el desempeño de la tripulación"],
        2: ["Incumplimiento del protocolo de atención por falta de capacitación", "Falla en manejo de objeciones y cobros por falta de guías", "Tripulación no sigue pasos de servicio DPO por falta de verificación", "Carencia de auditoría al cumplimiento de pasos de servicio"],
        3: ["Programa de capacitación no adaptado a necesidades reales del cliente", "Seguimiento insuficiente a tripulaciones con bajo NPS histórico", "Plan de incentivos de calidad sin criterios claros ni socializados", "Falta de medición de efectividad en programas de servicio"],
        4: ["Inexistencia de sesiones de feedback basadas en informes de desempeño", "Falta de mentores asignados a equipos con indicadores críticos", "Baja participación en programas de capacitación por falta de estímulo", "Planes de mejora no establecidos tras hallazgos de calidad"],
        5: ["Protocolos de atención no actualizados ante cambios en el servicio", "Falla en evaluación de desempeño en procesos de cobro", "Ausencia de penalización por incumplimiento reiterado de pasos DPO", "Comunicación inefectiva de estándares de excelencia operativa"]
    },
    "Adherencia a Km": {
        1: ["Desvío de ruta planeada por falta de monitoreo en tiempo real", "Kilometraje excedido por falta de comparación con telemetría", "Uso de vías alternas no autorizadas por falta de comunicación", "Inexistencia de historial de desvíos para análisis correctivo"],
        2: ["Falta de seguimiento al plan de ruta mediante herramientas digitales", "Visita a clientes fuera de secuencia por desconocimiento de prioridad", "Desvío para actividades personales por falta de control de paradas", "Incentivos de adherencia al plan de ruteo inexistentes"],
        3: ["Mallas de ruteo en sistema no revisadas periódicamente por zona", "Datos de tráfico real no integrados en la planificación", "Disciplina operativa deficiente en el cumplimiento de la ruta", "Geocercas y alertas de telemetría no configuradas correctamente"],
        4: ["Falta de capacitación técnica en sistemas de geolocalización", "Configuración del sistema de telemetría no auditada ni ajustada", "Feedback de tripulación sobre vías no integrado en el sistema", "Omisión de penalización sistemática ante desvíos injustificados"],
        5: ["Falta de revisión de reportes diarios vs plan de ruteo original", "Motivo de desvío no documentado para justificación operativa", "Inexistencia de comunicación sobre importancia del uso de rutas", "Rutas no ajustadas según hallazgos de kilometraje excedido"]
    },
    "Adherencia a Tiempo": {
        1: ["Retraso en ETA por falta de monitoreo de tráfico y planificación", "Tiempos muertos prolongados por secuencia de ruta ineficiente", "Inicio de ruta tardío por falta de control de salida en CD", "Inexistencia de comunicación de retrasos al equipo de monitoría"],
        2: ["Falla en secuencia cronológica por falta de formación técnica", "Demoras en paradas intermedias sin justificación documentada", "Ritmo de entrega no alineado al estándar operativo definido", "Falta de revisión de secuencia en tiempo real por supervisión"],
        3: ["Tiempos de servicio no redimensionados por tipo de cliente real", "Productividad por tripulación no medida ni comparada", "Tiempos de traslado no optimizados según análisis de tráfico", "Falta de ajuste del plan de tiempos según datos históricos"],
        4: ["Falta de auditoría de tiempos de servicio vs estándares teóricos", "Resultados de productividad no comunicados a los equipos", "Casos de éxito en eficiencia de tiempos no revisados", "Impacto de demoras en el cliente no evaluado por planificación"],
        5: ["Carencia de capacitación específica en gestión temporal de ruta", "Inexistencia de incentivos para la mejora continua en productividad", "Plan de tiempos no adaptado a cambios dinámicos", "Falta de comunicación sobre la importancia crítica de los tiempos"]
    },
    "PNP": {
        1: ["Parada en sitio no autorizado por falta de política socializada", "Vehículo detenido sin reporte de novedad por falta de transparencia", "Pérdida de tiempo en zonas críticas no identificadas previamente", "Falta de auditoría al cumplimiento de paradas en ruta"],
        2: ["Uso de parqueaderos fuera de ruta por falta de vías autorizadas", "Parada por motivos personales sin control de tiempo ni justificación", "Falla mecánica menor no reportada para evitar impacto", "Importancia de reportar novedades no comunicada a tripulación"],
        3: ["Monitoreo de GPS no realizado en tiempo real ni con alertas", "Plan de seguridad vial y paradas seguras no socializado", "Manual de paradas autorizadas no distribuido ni capacitado", "Falta de comprensión de la política de paradas por la tripulación"],
        4: ["Historial de paradas no auditado para detectar reincidencias", "Penalización de infracciones por paradas no autorizadas", "Eficiencia operativa impactada por falta de ajuste de rutas", "Motivo de parada detectada por GPS no revisado con operador"],
        5: ["Carencia de capacitación en seguridad y gestión de paradas", "Efectividad del plan de seguridad vial no revisada periódicamente", "Inexistencia de incentivos para el uso correcto de paradas", "Política de paradas no adaptada a la realidad de la zona Valle"]
    },
    "Cashless": {
        1: ["Recaudo de efectivo en zona crítica por falta de política clara", "Falla en uso de billeteras digitales por falta de conectividad", "Cliente insiste en efectivo por falta de comunicación Cashless", "Inexistencia de penalización por recaudo de efectivo prohibido"],
        2: ["Tripulación no valida estatus Cashless previo a la entrega", "Falta de conocimiento del cliente sobre medios de pago digitales", "Cobertura de red insuficiente para transacciones en tiempo real", "Educación financiera al cliente no incentivada por la operación"],
        3: ["Plan de bancarización para clientes críticos no identificado", "Herramientas digitales desactualizadas o incompatibles en campo", "Mensaje de política Cashless no adaptado ni medido en impacto", "Inexistencia de incentivos para el uso de herramientas digitales"],
        4: ["Motivo de falla en billeteras digitales no revisado técnicamente", "Estrategia de cobranza no adaptada ante insistencia de efectivo", "Soluciones de contingencia ante problemas de red no comunicadas", "Importancia de la política Cashless no reforzada al equipo"],
        5: ["Equipo no capacitado en políticas de bancarización y digitalización", "Efectividad de herramientas de pago no revisada periódicamente", "Comprensión del mensaje Cashless por el cliente no evaluada", "Falta de incentivos a la mejora continua en métricas de recaudo"]
    },
    "TML": {
        1: ["Demora en inspección de Check-list por falta de estándar de tiempo", "Reunión matinal extendida por falta de control de agenda", "Llegada tarde de tripulación por falta de control de puntualidad", "Incentivos por llegada a tiempo y eficiencia matutina inexistentes"],
        2: ["Estándar de revisión rápida DPO no seguido ni auditado", "Liderazgo no asignado para control de tiempo en sesiones", "Congestión en cargue de muelle por secuencia de carga ineficiente", "Impacto de la duración de reuniones no medido por el CD"],
        3: ["Digitalización del alistamiento no implementada o desactualizada", "Reentrenamiento en gestión del tiempo matutino no realizado", "Flujo de despacho en patio no revisado para eliminar cuellos", "Tecnología de alistamiento no incentivada para uso de tripulación"],
        4: ["Estándar de Check-list no comparado entre tripulaciones", "Duración de reuniones matinales no medida ni penalizada", "Flujo de carga no ajustado según productividad real de muelle", "Incentivos para la reducción de tiempos de alistamiento omitidos"],
        5: ["Contenidos de reentrenamiento en gestión de tiempo no adaptados", "Efectividad de herramientas digitales de alistamiento no revisada", "Plan de flujo de patio no ajustado según cambios operativos", "Falta de comunicación sobre importancia crítica del TML"]
    },
    "TR": {
        1: ["Tráfico pesado en corredores no analizado históricamente", "Demoras en descargue por volumen elevado sin secuencia ajustada", "Ruta con exceso de clientes por falla en la planificación", "Retrasos no comunicados a monitoría para ajuste de ETAs"],
        2: ["Falla en planeación dinámica por falta de herramientas digitales", "Cierres viales conocidos no contemplados en el plan de ruteo", "Demora excesiva en primer cliente por secuencia de salida", "Uso de herramientas de ruteo dinámico no incentivado"],
        3: ["Rediseño de mallas geográficas sin feedback de la tripulación", "Ventanas de servicio y ETAs no ajustados según análisis", "Alertas de tráfico en tiempo real no implementadas", "Falta de adaptación a cambios dinámicos en zonas operativas"],
        4: ["Motivo de tráfico pesado no revisado para ajuste de plan futuro", "Flujo de trabajo en descargue de alto volumen no auditado", "Carga de trabajo por exceso de clientes no comunicada", "Efectividad de alertas de tráfico no medida en la operación"],
        5: ["Falta de capacitación en nuevas herramientas de gestión de rutas", "Impacto de cambios en ventanas de servicio no medido", "Inexistencia de incentivos para el feedback operativo sobre mallas", "Importancia del cumplimiento del TR no socializada con el equipo"]
    },
    "TI": {
        1: ["Fila excesiva para ingreso al CD por flujo de entrada ineficiente", "Demora en liquidación administrativa por falta de automatización", "Espera para descarga de envase vacío por secuencia no ajustada", "Incentivos a la eficiencia en procesos de retorno inexistentes"],
        2: ["Proceso manual de arqueo con errores por falta de estándar", "Plantilla de personal en liquidación insuficiente para la carga", "Desorden en flujo de parqueo interno por falta de disciplina", "Carga de trabajo en oficina de liquidación no revisada"],
        3: ["Automatización del cierre de jornada no actualizada", "Rediseño del flujo de retorno al CD no realizado periódicamente", "Tiempos de recepción de envase no optimizados por secuencia", "Efectividad de tecnología de cierre de jornada no revisada"],
        4: ["Motivo de filas excesivas en Check-in no auditado sistemáticamente", "Flujo de liquidación no revisado para eliminar pasos manuales", "Importancia de la eficiencia en el TI no comunicada", "Proceso de recepción de envase no ajustado según hallazgos"],
        5: ["Contenidos de capacitación en herramientas de cierre desactualizados", "Impacto de rediseño de flujo de retorno no medido operativamente", "Mejora continua en procesos de liquidación no incentivada", "Flujo de parqueo interno no adaptado a cambios de flota"]
    },
    "DQI": {
        1: ["Avería en descargue por falta de capacitación en manipulación", "Producto golpeado desde cargue por proceso de estibado ineficiente", "Cajas mojadas por almacenamiento inadecuado o falta de protección", "Falta de atención al detalle incentivada en el equipo de muelle"],
        2: ["Manipulación brusca por tripulación sin revisión de desempeño", "Falta de disponibilidad o uso de separadores de protección", "Protocolo de estibado incorrecto que permite movimiento de carga", "Penalización por incumplimiento de estibado seguro inexistente"],
        3: ["Reentrenamiento en estándar de calidad no actualizado ni medido", "Inversión en kits de protección de carga no evaluada", "Auditoría de cargue en muelle no realizada de forma periódica", "Participación en sesiones de calidad no incentivada"],
        4: ["Motivo de averías en descargue no ajustado en procesos técnicos", "Proceso de estibado no auditado sistemáticamente en el cargue", "Carencia de material de protección adecuado para humedad/golpes", "Comunicación de resultados de auditoría de muelle inexistente"],
        5: ["Contenidos de reentrenamiento de calidad no adaptados", "Efectividad de kits de protección no medida en reducción de averías", "Mejora continua en procesos de calidad no incentivada", "Importancia del cuidado de la carga no socializada formalmente"]
    },
    "SAC Atribuibles UC": {
        1: ["Falta de registro detallado de incidencias SAC atribuidas a UC", "Criterios de atribución ambiguos por falta de estándar de monitoría", "Ambigüedad en la responsabilidad del transportador en quejas de servicio", "Falta de validación de datos SAC contra evidencias de entrega"],
        2: ["Falta de formación práctica en manejo de clientes difíciles en ruta", "Errores en cierre de casos SAC por falta de evidencias en App", "Impacto de penalizaciones SAC no comunicado a la tripulación", "Contenidos de capacitación SAC no adaptados a la operación T2"],
        3: ["Incidencias SAC no detectadas por falta de auditoría de monitoría", "Falta de evidencia fotográfica para desestimar quejas infundadas", "Desviaciones en protocolo de servicio no reportadas por SAC", "Falta de feedback directo del área SAC a los supervisores de ruta"],
        4: ["Ausencia de reconocimiento por cero quejas SAC en la jornada", "Desmotivación de tripulación ante fallos en plataforma de atención", "Falta de competencia sana entre tripulaciones por métricas de SAC", "Desconocimiento de logros en calidad de servicio por la tripulación"],
        5: ["Obsolescencia de sistemas de reporte de incidencias en campo", "Falta de integración en tiempo real entre SAC y App de despacho", "Procesos manuales de escalación SAC que retrasan la solución", "Incidencias tecnológicas SAC no reportadas por la tripulación"]
    },
    "Tiempo de atención en PDV": {
        1: ["Falta de medición de tiempos mediante geocercas en PDV", "Desconocimiento del estándar de tiempo de entrega por cliente", "Variabilidad en tiempos de atención no identificada en planeación", "Falta de validación de tiempos de espera con el cliente en PDV"],
        2: ["Falta de formación en gestión temporal y descarga ágil en PDV", "Errores en secuencia de tareas de entrega dentro del establecimiento", "Desconocimiento de la importancia del tiempo en PDV para el TR", "Capacitación en procesos de entrega no adaptada a nuevos envases"],
        3: ["Incidencias de tiempo prolongado no detectadas por monitoría", "Falta de evidencia de demoras causadas por el cliente en PDV", "Desviaciones en el proceso de entrega no reportadas en tiempo real", "Falta de feedback sobre tiempos de atención entre ruta y planeación"],
        4: ["Ausencia de reconocimiento por eficiencia en tiempos de descarga", "Desmotivación ante fallos en sincronización de App en el PDV", "Falta de competencia sana por menores tiempos de atención en zona", "Desconocimiento de logros en productividad horaria por tripulación"],
        5: ["Obsolescencia de sistemas de registro de entrada/salida de PDV", "Falta de integración entre planeador de rutas y tiempos reales", "Procesos manuales de registro de tiempos que generan errores", "Incidencias tecnológicas de geolocalización en PDV no reportadas"]
    },
    "Adherencia al check-list": {
        1: ["Falta de registro de check-list matutino por omisión de tripulación", "Desconocimiento del protocolo técnico de revisión vehicular DPO", "Variabilidad en la veracidad del reporte por falta de supervisión", "Falta de validación física del check-list por el despachador"],
        2: ["Falta de formación en identificación de fallas críticas en patio", "Errores en secuencia de revisión de activos y equipo de frío", "Desconocimiento de la importancia de la seguridad vial en ruta", "Falta de actualización de ítems de check-list en la App móvil"],
        3: ["Incidencias mecánicas en ruta no detectadas en el check-list", "Falta de evidencia fotográfica de ítems críticos en el reporte", "Desviaciones en el proceso de auditoría de salida del CD", "Falta de feedback sobre estado de flota entre flota y taller"],
        4: ["Ausencia de reconocimiento por cumplimiento perfecto de check-list", "Desmotivación ante fallos de hardware en terminales de captura", "Falta de competencia sana entre tripulaciones por cuidado de activos", "Desconocimiento de logros en disponibilidad mecánica por tripulación"],
        5: ["Obsolescencia de sistemas de registro de mantenimiento preventivo", "Falta de integración entre check-list App y gestión de taller", "Procesos manuales de revisión que retrasan la salida a ruta", "Incidencias tecnológicas de sincronización de check-list en patio"]
    },
    "Entrega en rangos": {
        1: ["Falta de medición de rangos horarios por errores en secuencia", "Desconocimiento del estándar de rango prometido al cliente", "Variabilidad en cumplimiento de rangos por tráfico no planeado", "Falta de validación de compromiso horario con el área comercial"],
        2: ["Falta de formación en priorización de clientes según rango horario", "Errores en secuencia de ruta que obligan a saltar clientes", "Desconocimiento de la importancia de la ventana horaria DPO", "Falta de actualización de rangos de entrega en sistema maestro"],
        3: ["Incidencias de incumplimiento de rango no alertadas por monitoría", "Falta de evidencia de causas externas que afectaron el rango", "Desviaciones en el proceso de despacho que retrasan el primer rango", "Falta de feedback de la tripulación sobre rangos incumplibles"],
        4: ["Ausencia de reconocimiento por cumplimiento de ventanas horarias", "Desmotivación ante fallos de cálculo de ETA en la App de ruta", "Falta de competencia sana entre zonas por cumplimiento de rangos", "Desconocimiento de logros en OTIF y rangos por la tripulación"],
        5: ["Obsolescencia de sistemas de cálculo dinámico de rangos horarios", "Falta de integración entre monitoría T2 y avisos al cliente", "Procesos manuales de aviso de llegada que generan demoras", "Incidencias tecnológicas de cálculo de tiempo en ruta no reportadas"]
    },
    "Cantidad de rutas mayor a 10 HR": {
        1: ["Falta de registro de causas de jornada extendida en la App", "Desconocimiento del protocolo de seguridad y fatiga del conductor", "Variabilidad en duración de ruta por exceso de carga operativa", "Falta de validación de jornada real vs planeada por supervisor"],
        2: ["Falta de formación en gestión de descansos y eficiencia en jornada", "Errores en secuencia de tareas que prolongan el tiempo en calle", "Desconocimiento de la normativa DPO sobre horas máximas de ruta", "Falta de actualización de bases de tiempos de servicio en sistema"],
        3: ["Incidencias de rutas de larga duración no escaladas a tiempo", "Falta de evidencia de causas de retraso extremo (vías/clientes)", "Desviaciones en el proceso de retorno y liquidación en el CD", "Falta de feedback entre tripulación y planeación sobre jornadas"],
        4: ["Ausencia de reconocimiento por rutas finalizadas en tiempo óptimo", "Desmotivación por fallos en herramientas de navegación de ruta", "Falta de competencia sana por reducción de horas extras en patio", "Desconocimiento de logros en balance vida-trabajo por tripulación"],
        5: ["Obsolescencia de sistemas de jornada laboral y telemetría", "Falta de integración entre gestión de flota y planeación T2", "Procesos manuales de arqueo y cierre que extienden la jornada", "Incidencias tecnológicas de registro de jornada no reportadas"]
    }
};

/**
 * FUNCIÓN DE APOYO LOCAL
 * Retorna las opciones de la matriz según el KPI y nivel.
 */
const obtenerRespaldo = (kpi, nivel) => {
    const kpiData = matrizDPO[kpi] || matrizDPO["Rechazos"]; 
    const n = parseInt(nivel);
    
    if (n >= 5) return kpiData[5];
    if (n <= 1) return kpiData[1];
    return kpiData[n] || kpiData[1];
};

/**
 * EXPORTS: generarSugerencia
 * Lógica 100% Offline para Gerencia Valle.
 */
exports.generarSugerencia = async (req, res) => {
    const { nivelPorqué, contextoOriginal, indicadorSeleccionado } = req.body;

    // 1. VALIDACIÓN DE ENTRADA
    if (!nivelPorqué || !contextoOriginal || !indicadorSeleccionado) {
        return res.status(400).json({
            exito: false,
            mensaje: "Faltan datos requeridos para generar sugerencias."
        });
    }

    // 2. PROCESAMIENTO LOCAL (Sin APIs externas)
    try {
        const opciones = obtenerRespaldo(indicadorSeleccionado, nivelPorqué);

        // 3. RESPUESTA EXITOSA
        return res.status(200).json({
            exito: true,
            opciones: opciones
        });

    } catch (error) {
        // 4. MANEJO DE ERRORES INTERNOS
        console.error("Error interno en iaController:", error.message);
        return res.status(500).json({
            exito: false,
            mensaje: "Error interno al procesar la matriz local."
        });
    }
};