// ===============================
// GESTIÓN RTA - LÓGICA FORMULARIO
// ===============================

// ===== BASE LOCAL DE SUGERENCIAS POR KPI =====
const sugerenciasPorKPI = {
    NPS: [
        {
            titulo: "Protocolo de Servicio",
            porQue2: "El transportador no aplicó correctamente el protocolo de atención al cliente.",
            porQue3: "No hubo refuerzo reciente sobre estándares de servicio en ruta.",
            porQue4: "El seguimiento en campo se enfocó más en tiempos que en experiencia del cliente.",
            porQue5: "No existe una rutina sólida de coaching sobre servicio al cliente.",
            causaRaiz: "Debilidad en el refuerzo operativo de estándares de servicio al cliente.",
            planAccion: "Realizar reentrenamiento de servicio al cliente con la tripulación involucrada y validar cumplimiento en ruta."
        },
        {
            titulo: "Comunicación con Cliente",
            porQue2: "El cliente no recibió información clara sobre la novedad presentada.",
            porQue3: "La tripulación no reportó oportunamente la situación al área responsable.",
            porQue4: "No hay una rutina clara para comunicar desviaciones durante la entrega.",
            porQue5: "El proceso de comunicación preventiva no está estandarizado.",
            causaRaiz: "Falta de protocolo efectivo para informar novedades al cliente durante la entrega.",
            planAccion: "Definir y socializar protocolo de comunicación de novedades con clientes críticos."
        },
        {
            titulo: "Calidad Percibida",
            porQue2: "El cliente percibió baja calidad en la entrega o atención.",
            porQue3: "No se verificaron condiciones de presentación del producto y del personal.",
            porQue4: "El checklist de salida no contempla controles de experiencia del cliente.",
            porQue5: "Los indicadores de experiencia no están conectados con rutinas operativas diarias.",
            causaRaiz: "Falta de integración entre la medición NPS y las rutinas operativas de entrega.",
            planAccion: "Incluir puntos de experiencia del cliente dentro del checklist de salida y seguimiento diario."
        }
    ],

    OTIF: [
        {
            titulo: "Salida Tardía",
            porQue2: "El vehículo salió tarde del centro de distribución.",
            porQue3: "El cargue o documentación no estuvo lista a tiempo.",
            porQue4: "No se anticiparon restricciones operativas del turno.",
            porQue5: "La planificación de salida no considera buffers ante desviaciones.",
            causaRaiz: "Planeación insuficiente del proceso de liberación de rutas.",
            planAccion: "Implementar control horario de cargue, documentación y salida con responsables definidos."
        },
        {
            titulo: "Entrega Incompleta",
            porQue2: "El pedido no fue entregado completo al cliente.",
            porQue3: "Hubo diferencia entre lo facturado, alistado y cargado.",
            porQue4: "La validación de picking/cargue no fue efectiva.",
            porQue5: "No existe control cruzado robusto antes de despacho.",
            causaRaiz: "Falla en el proceso de validación final de pedidos antes de salida.",
            planAccion: "Aplicar doble validación de pedidos críticos antes del despacho."
        },
        {
            titulo: "Incumplimiento de Ventana",
            porQue2: "La entrega no llegó dentro de la ventana acordada.",
            porQue3: "La ruta tuvo demoras no previstas.",
            porQue4: "La programación no consideró restricciones reales del territorio.",
            porQue5: "La información de tiempos de ruta no se actualiza con datos reales.",
            causaRaiz: "Ruteo no ajustado a condiciones reales de operación.",
            planAccion: "Actualizar parámetros de ruteo con tiempos reales y restricciones por zona."
        }
    ],

    RMD: [
        {
            titulo: "Desempeño de Tripulación",
            porQue2: "La tripulación no cumplió el estándar esperado durante la entrega.",
            porQue3: "No se reforzaron rutinas de entrega efectiva.",
            porQue4: "La supervisión en campo fue insuficiente.",
            porQue5: "No existe seguimiento individual a calificaciones bajas.",
            causaRaiz: "Falta de gestión individual sobre desempeño de tripulaciones.",
            planAccion: "Realizar retroalimentación individual y acompañamiento en ruta a la tripulación afectada."
        },
        {
            titulo: "Demora en Punto de Venta",
            porQue2: "El cliente percibió demora durante el proceso de entrega.",
            porQue3: "La tripulación no gestionó adecuadamente descargue, envase o saldos.",
            porQue4: "No se aplicó una rutina estándar de atención en punto.",
            porQue5: "El entrenamiento operativo no enfatiza tiempos de atención al cliente.",
            causaRaiz: "Falta de estándar práctico para atención eficiente en punto de entrega.",
            planAccion: "Reforzar procedimiento de entrega rápida y ordenada en clientes de alto impacto."
        },
        {
            titulo: "Manejo de Novedades",
            porQue2: "La novedad no fue resuelta adecuadamente frente al cliente.",
            porQue3: "La tripulación no tenía claridad sobre cómo escalar el caso.",
            porQue4: "No hay ruta clara de soporte ante novedades en entrega.",
            porQue5: "El proceso de escalamiento no está suficientemente interiorizado.",
            causaRaiz: "Falla en el conocimiento del proceso de atención de novedades.",
            planAccion: "Socializar matriz de escalamiento y responsables para novedades en ruta."
        }
    ],

    InFull: [
        {
            titulo: "Faltante de Producto",
            porQue2: "El pedido salió o llegó incompleto.",
            porQue3: "No se detectó el faltante durante el alistamiento.",
            porQue4: "El control de inventario/picking no fue suficiente.",
            porQue5: "No hay verificación robusta en referencias críticas.",
            causaRaiz: "Debilidad en el control de alistamiento de pedidos.",
            planAccion: "Implementar verificación adicional para referencias de alta rotación o clientes críticos."
        },
        {
            titulo: "Diferencia Inventario vs Pedido",
            porQue2: "La referencia solicitada no estaba disponible al momento de despacho.",
            porQue3: "La disponibilidad no fue validada antes de confirmar el pedido.",
            porQue4: "Hay desalineación entre inventario, ventas y despacho.",
            porQue5: "No existe alerta temprana de agotados para operación.",
            causaRaiz: "Falta de sincronización entre disponibilidad real y pedidos confirmados.",
            planAccion: "Crear rutina diaria de revisión de agotados y comunicación a ventas/despacho."
        },
        {
            titulo: "Error de Cargue",
            porQue2: "El producto correcto no fue cargado en el vehículo.",
            porQue3: "El control de cargue no detectó la diferencia.",
            porQue4: "La validación se realiza de forma manual o incompleta.",
            porQue5: "No se priorizan controles en pedidos sensibles.",
            causaRaiz: "Falla en la validación final del cargue.",
            planAccion: "Aplicar checklist de cargue por cliente/pedido antes de salida."
        }
    ],

    OnTime: [
        {
            titulo: "Retraso de Salida",
            porQue2: "La ruta inició después del horario planeado.",
            porQue3: "Hubo retraso en cargue, documentación o liberación.",
            porQue4: "No se controló el avance de actividades previas a salida.",
            porQue5: "No hay gestión visual de tiempos por etapa.",
            causaRaiz: "Falta de control operativo del proceso de salida.",
            planAccion: "Implementar tablero de control de salida por ruta y responsable."
        },
        {
            titulo: "Demora en Ruta",
            porQue2: "La ruta presentó demoras durante la ejecución.",
            porQue3: "Hubo tiempos altos en clientes o desplazamientos.",
            porQue4: "La programación no consideró restricciones reales.",
            porQue5: "No se analizan desviaciones históricas por zona.",
            causaRaiz: "Planeación de ruta no ajustada al comportamiento real del territorio.",
            planAccion: "Revisar tiempos reales por zona y ajustar ventanas de entrega."
        },
        {
            titulo: "Gestión de Novedades",
            porQue2: "Una novedad en ruta retrasó entregas posteriores.",
            porQue3: "La novedad no fue escalada oportunamente.",
            porQue4: "No hay respuesta rápida ante bloqueos operativos.",
            porQue5: "El proceso de soporte en ruta no está estandarizado.",
            causaRaiz: "Falta de protocolo ágil para resolución de novedades en ruta.",
            planAccion: "Definir canal y tiempos de respuesta para soporte a tripulaciones."
        }
    ],

    TML: [
        {
            titulo: "Liberación Tardía",
            porQue2: "La tripulación tardó más de lo esperado en salir a ruta.",
            porQue3: "Las actividades previas no estaban listas a tiempo.",
            porQue4: "No se anticiparon tareas de cargue/documentación.",
            porQue5: "Falta una rutina de prealistamiento del turno.",
            causaRaiz: "Deficiencia en la preparación previa a la salida de rutas.",
            planAccion: "Implementar rutina de prealistamiento antes de llegada de tripulaciones."
        },
        {
            titulo: "Demora Administrativa",
            porQue2: "El proceso documental retrasó la salida.",
            porQue3: "Facturación, guías o soportes no estaban disponibles.",
            porQue4: "No hay responsable único de liberar documentos.",
            porQue5: "El flujo documental no tiene control horario.",
            causaRaiz: "Falta de control y responsable claro para liberación documental.",
            planAccion: "Asignar responsable de documentación y medir tiempo de liberación diaria."
        },
        {
            titulo: "Disponibilidad de Recursos",
            porQue2: "Faltó equipo, personal o herramienta para salida.",
            porQue3: "No se validó disponibilidad antes del inicio del turno.",
            porQue4: "No existe checklist previo de recursos críticos.",
            porQue5: "La operación reacciona al problema en vez de anticiparlo.",
            causaRaiz: "Ausencia de validación anticipada de recursos para salida.",
            planAccion: "Crear checklist de recursos críticos antes del inicio de operación."
        }
    ],

    WQI: [
        {
            titulo: "Rotura por Manipulación",
            porQue2: "Se generaron unidades rotas durante manipulación en almacén.",
            porQue3: "No se aplicó correctamente el estándar de manejo.",
            porQue4: "La supervisión de manipulación fue insuficiente.",
            porQue5: "El entrenamiento en manejo de producto no está reforzado.",
            causaRaiz: "Debilidad en la aplicación del estándar de manipulación en almacén.",
            planAccion: "Reentrenar al personal en manipulación segura y auditar puntos críticos."
        },
        {
            titulo: "Condición de Almacenamiento",
            porQue2: "El producto se dañó por condiciones inadecuadas de almacenamiento.",
            porQue3: "No se controló apilamiento, ubicación o estabilidad.",
            porQue4: "La gestión visual de límites no es suficiente.",
            porQue5: "No se revisan condiciones de almacenamiento diariamente.",
            causaRaiz: "Falta de control visual y rutina sobre condiciones de almacenamiento.",
            planAccion: "Implementar inspección diaria de apilamiento, estabilidad y zonas críticas."
        },
        {
            titulo: "Equipo de Manejo",
            porQue2: "El equipo de movimiento contribuyó al daño de producto.",
            porQue3: "El equipo no estaba en condiciones óptimas o se usó incorrectamente.",
            porQue4: "No se detectó la condición en inspección previa.",
            porQue5: "La revisión de equipos no está conectada al indicador de calidad.",
            causaRaiz: "Falla en control de equipos que impactan calidad de producto.",
            planAccion: "Incluir condición de equipos de manejo dentro de rutina WQI."
        }
    ],

    TRI: [
        {
            titulo: "Condición Insegura",
            porQue2: "Existía una condición insegura en el área.",
            porQue3: "La condición no fue corregida antes de iniciar la actividad.",
            porQue4: "La inspección previa no fue efectiva.",
            porQue5: "No hay cierre oportuno de hallazgos de seguridad.",
            causaRaiz: "Falla en la gestión preventiva de condiciones inseguras.",
            planAccion: "Implementar cierre obligatorio de hallazgos críticos antes de operar."
        },
        {
            titulo: "Acto Inseguro",
            porQue2: "El colaborador realizó una acción fuera del estándar seguro.",
            porQue3: "No se aplicó el procedimiento establecido.",
            porQue4: "El comportamiento inseguro no fue corregido a tiempo.",
            porQue5: "La cultura de intervención en seguridad es débil.",
            causaRaiz: "Falta de disciplina operacional frente a comportamientos inseguros.",
            planAccion: "Realizar charla de seguridad y observación comportamental en el área."
        },
        {
            titulo: "Falla de Control",
            porQue2: "El control preventivo no evitó el accidente.",
            porQue3: "El riesgo estaba identificado pero no gestionado.",
            porQue4: "No se hizo seguimiento a acciones previas.",
            porQue5: "No existe dueño claro del cierre de controles.",
            causaRaiz: "Debilidad en seguimiento de controles de seguridad.",
            planAccion: "Asignar responsables y fechas de cierre a controles críticos de seguridad."
        }
    ],

    VLC: [
        {
            titulo: "Costo por Ineficiencia",
            porQue2: "Se generó mayor costo operativo del esperado.",
            porQue3: "La ruta tuvo tiempos o recursos adicionales.",
            porQue4: "No se controlaron desvíos frente al plan.",
            porQue5: "No hay seguimiento diario a causas de sobrecosto.",
            causaRaiz: "Falta de control operativo sobre desviaciones que impactan costo.",
            planAccion: "Implementar revisión diaria de desviaciones de costo por ruta/CD."
        },
        {
            titulo: "Uso Ineficiente de Recursos",
            porQue2: "Se utilizaron más recursos de los necesarios.",
            porQue3: "La planeación no optimizó capacidad o tiempos.",
            porQue4: "No se revisa productividad antes de asignar recursos.",
            porQue5: "Las decisiones se basan en urgencia y no en eficiencia.",
            causaRaiz: "Falta de criterios de eficiencia en asignación operativa.",
            planAccion: "Definir regla de asignación de recursos según volumen y capacidad."
        },
        {
            titulo: "Desvío No Controlado",
            porQue2: "Se presentó gasto no previsto en la operación.",
            porQue3: "La novedad no se reportó oportunamente.",
            porQue4: "No existe canal estándar para justificar sobrecostos.",
            porQue5: "El control de gastos es posterior y no preventivo.",
            causaRaiz: "Falta de control preventivo de gastos variables.",
            planAccion: "Crear formato rápido de reporte y aprobación de gastos excepcionales."
        }
    ],

    LTI: [
        {
            titulo: "Lesión por Procedimiento",
            porQue2: "La actividad se ejecutó sin cumplir el procedimiento seguro.",
            porQue3: "El colaborador no aplicó controles antes de iniciar.",
            porQue4: "La supervisión no verificó la tarea crítica.",
            porQue5: "No existe rutina de validación de tareas de riesgo.",
            causaRaiz: "Debilidad en control de tareas críticas de seguridad.",
            planAccion: "Implementar permiso/verificación previa para tareas de riesgo."
        },
        {
            titulo: "Falta de EPP",
            porQue2: "El colaborador no usó el elemento de protección requerido.",
            porQue3: "El EPP no estaba disponible o no fue exigido.",
            porQue4: "No se controló inventario o uso de EPP.",
            porQue5: "La rutina de verificación de EPP no es consistente.",
            causaRaiz: "Falla en control de disponibilidad y uso de EPP.",
            planAccion: "Auditar EPP al inicio de turno y cerrar brechas de inventario."
        },
        {
            titulo: "Fatiga Operativa",
            porQue2: "La persona presentó fatiga durante la actividad.",
            porQue3: "La carga de trabajo fue alta o extendida.",
            porQue4: "No se gestionaron pausas o rotación de tareas.",
            porQue5: "La planeación de personal no contempló riesgos de fatiga.",
            causaRaiz: "Falta de gestión preventiva de fatiga operacional.",
            planAccion: "Definir pausas, rotación y seguimiento para jornadas extendidas."
        }
    ],

    RTM: [
        {
            titulo: "Pedido Rechazado por Planeación",
            porQue2: "El pedido fue rechazado antes de salir a entrega.",
            porQue3: "La planeación no consideró restricciones del cliente o inventario.",
            porQue4: "No se validó la viabilidad del pedido antes de despacho.",
            porQue5: "Hay desalineación entre ventas, inventario y operación.",
            causaRaiz: "Falta de validación previa de pedidos antes de asignarlos a ruta.",
            planAccion: "Implementar control de viabilidad de pedidos antes del despacho."
        },
        {
            titulo: "Agotado o Producto No Disponible",
            porQue2: "El producto solicitado no estaba disponible.",
            porQue3: "No se detectó el agotado antes de confirmar la ruta.",
            porQue4: "No hay alerta temprana para referencias críticas.",
            porQue5: "El proceso reacciona tarde frente a inventario insuficiente.",
            causaRaiz: "Falta de alerta y gestión anticipada de agotados.",
            planAccion: "Crear revisión diaria de agotados y comunicación a programación."
        },
        {
            titulo: "Error Comercial",
            porQue2: "El pedido no correspondía a la necesidad real del cliente.",
            porQue3: "La información del pedido fue ingresada incorrectamente.",
            porQue4: "No se realizó confirmación con el cliente.",
            porQue5: "La presión comercial afectó la calidad del pedido.",
            causaRaiz: "Debilidad en la calidad de toma y confirmación de pedidos.",
            planAccion: "Validar pedidos sensibles con cliente antes de liberarlos a operación."
        }
    ],

    TP: [
        {
            titulo: "Baja Productividad",
            porQue2: "La productividad estuvo por debajo de lo esperado.",
            porQue3: "Se movilizó menor volumen con la misma cantidad de personal.",
            porQue4: "La asignación de recursos no fue proporcional al volumen.",
            porQue5: "No se ajustan recursos según demanda diaria.",
            causaRaiz: "Falta de balanceo entre recursos y volumen operativo.",
            planAccion: "Ajustar dotación diaria según forecast y volumen real."
        },
        {
            titulo: "Tiempos Muertos",
            porQue2: "Se presentaron tiempos muertos durante la operación.",
            porQue3: "El personal esperó instrucciones, equipos o liberación.",
            porQue4: "No se coordinó oportunamente la secuencia de actividades.",
            porQue5: "No hay gestión visual del flujo de trabajo.",
            causaRaiz: "Falta de coordinación operativa para reducir esperas.",
            planAccion: "Implementar tablero de actividades y responsables por turno."
        },
        {
            titulo: "Capacidad Mal Utilizada",
            porQue2: "La capacidad disponible no se aprovechó adecuadamente.",
            porQue3: "Hubo desbalance entre zonas, equipos o personal.",
            porQue4: "La supervisión no redistribuyó recursos a tiempo.",
            porQue5: "No hay alertas de desviación durante la jornada.",
            causaRaiz: "Falta de gestión dinámica de recursos durante la operación.",
            planAccion: "Revisar productividad por franja horaria y reasignar recursos en tiempo real."
        }
    ],

    TQI: [
        {
            titulo: "Rotura Total por Manipulación",
            porQue2: "Se generaron unidades rotas durante manipulación o transporte interno.",
            porQue3: "No se aplicaron estándares de manejo seguro.",
            porQue4: "El seguimiento a calidad en operación fue insuficiente.",
            porQue5: "El indicador no se conecta con acciones preventivas diarias.",
            causaRaiz: "Falta de control preventivo sobre puntos críticos de rotura.",
            planAccion: "Identificar zonas críticas de rotura y ejecutar plan de reducción."
        },
        {
            titulo: "Apilamiento Incorrecto",
            porQue2: "El producto se dañó por mala configuración de carga/apilamiento.",
            porQue3: "No se respetaron límites o criterios de estabilidad.",
            porQue4: "No existe gestión visual clara para configuración segura.",
            porQue5: "El personal no ha sido reforzado en estándar de apilamiento.",
            causaRaiz: "Incumplimiento del estándar de apilamiento y configuración.",
            planAccion: "Reentrenar y auditar configuración de carga en puntos críticos."
        },
        {
            titulo: "Condición de Equipo o Ruta",
            porQue2: "La rotura fue influenciada por condición de equipo, vehículo o ruta.",
            porQue3: "No se detectó la condición antes de operar.",
            porQue4: "Los checklist no están conectados con calidad del producto.",
            porQue5: "El mantenimiento se enfoca en disponibilidad más que en calidad.",
            causaRaiz: "Falta de conexión entre mantenimiento y calidad del producto.",
            planAccion: "Incluir variables de calidad en inspecciones de equipos y vehículos."
        }
    ],

    DQI: [
        {
            titulo: "Rotura en Reparto",
            porQue2: "Se generaron unidades rotas durante la entrega.",
            porQue3: "La manipulación en punto de venta no fue adecuada.",
            porQue4: "No se usaron herramientas o buenas prácticas de descargue.",
            porQue5: "No hay seguimiento en campo a la calidad del descargue.",
            causaRaiz: "Falta de control en prácticas de descargue en reparto.",
            planAccion: "Acompañar ruta crítica y reforzar manipulación segura en entrega."
        },
        {
            titulo: "Carga Mal Asegurada",
            porQue2: "El producto se desplazó durante el recorrido.",
            porQue3: "No se aseguraron correctamente estibas/canastas.",
            porQue4: "No se verificó aseguramiento antes de salida.",
            porQue5: "No existe checklist específico de calidad de carga.",
            causaRaiz: "Falla en aseguramiento de carga para reparto.",
            planAccion: "Implementar verificación obligatoria de aseguramiento antes de salida."
        },
        {
            titulo: "Condición de Vehículo",
            porQue2: "La condición del vehículo afectó la integridad del producto.",
            porQue3: "Suspensión, piso o compartimiento presentaban novedad.",
            porQue4: "La novedad no fue reportada o atendida a tiempo.",
            porQue5: "La inspección preoperacional no identifica riesgos de rotura.",
            causaRaiz: "Inspección vehicular insuficiente frente a riesgos de calidad.",
            planAccion: "Incluir revisión de condiciones que impactan DQI en checklist vehicular."
        }
    ],

    AE: [
        {
            titulo: "Activo No Disponible",
            porQue2: "El activo requerido no estuvo disponible para operar.",
            porQue3: "El equipo/vehículo estaba en mantenimiento o con falla.",
            porQue4: "No se anticipó la indisponibilidad.",
            porQue5: "El plan preventivo no evita fallas recurrentes.",
            causaRaiz: "Mantenimiento preventivo insuficiente para asegurar disponibilidad.",
            planAccion: "Revisar plan preventivo de activos críticos y ajustar frecuencia."
        },
        {
            titulo: "Uso Ineficiente del Activo",
            porQue2: "El activo estuvo disponible pero no se utilizó eficientemente.",
            porQue3: "La asignación no correspondió a la demanda real.",
            porQue4: "No se monitorea utilización por activo diariamente.",
            porQue5: "La planeación no optimiza capacidad instalada.",
            causaRaiz: "Falta de control sobre utilización efectiva de activos.",
            planAccion: "Medir utilización diaria por activo y ajustar asignación operativa."
        },
        {
            titulo: "Restricción Administrativa",
            porQue2: "El activo no pudo operar por restricción documental o administrativa.",
            porQue3: "Documentos, permisos o registros no estaban vigentes.",
            porQue4: "No hubo alerta previa de vencimiento.",
            porQue5: "El control documental no está automatizado.",
            causaRaiz: "Falla en gestión documental de activos.",
            planAccion: "Crear alertas de vencimiento y responsable de control documental."
        }
    ],

    AO: [
        {
            titulo: "Baja Ocupación",
            porQue2: "El vehículo salió con ocupación inferior a la esperada.",
            porQue3: "El volumen asignado no llenó la capacidad disponible.",
            porQue4: "No se consolidaron pedidos o zonas compatibles.",
            porQue5: "La planeación priorizó salida rápida sobre ocupación óptima.",
            causaRaiz: "Falta de consolidación de carga para optimizar ocupación.",
            planAccion: "Revisar consolidación de rutas antes de despacho."
        },
        {
            titulo: "Distribución Ineficiente de Carga",
            porQue2: "La carga no fue distribuida de forma óptima.",
            porQue3: "Se asignaron pedidos con bajo volumen a vehículo sobredimensionado.",
            porQue4: "No se usan criterios de capacidad por tipo de vehículo.",
            porQue5: "La herramienta de planeación no tiene parámetros actualizados.",
            causaRaiz: "Asignación de vehículo no alineada con volumen real.",
            planAccion: "Actualizar parámetros de capacidad y reglas de asignación por vehículo."
        },
        {
            titulo: "Pedido Bajo Volumen",
            porQue2: "Se atendieron pedidos con volumen muy bajo.",
            porQue3: "No se aplicó criterio mínimo de despacho eficiente.",
            porQue4: "La política comercial permite pedidos poco rentables.",
            porQue5: "No se evalúa costo de servir por cliente/zona.",
            causaRaiz: "Desalineación entre política comercial y eficiencia logística.",
            planAccion: "Revisar pedido mínimo o frecuencia de atención para zonas críticas."
        }
    ],

    AU: [
        {
            titulo: "Baja Utilización",
            porQue2: "El vehículo/equipo tuvo baja utilización durante la jornada.",
            porQue3: "Pasó tiempo disponible sin asignación productiva.",
            porQue4: "La programación no contempló segundo uso o retorno útil.",
            porQue5: "No se gestionan oportunidades de utilización adicional.",
            causaRaiz: "Planeación limitada para maximizar uso de activos.",
            planAccion: "Diseñar plan de segunda vuelta o uso alternativo para activos disponibles."
        },
        {
            titulo: "Tiempo Inactivo",
            porQue2: "El activo presentó tiempo inactivo no planificado.",
            porQue3: "Hubo espera por personal, documentación o carga.",
            porQue4: "No se coordinó la disponibilidad de recursos.",
            porQue5: "No existe gestión horaria de utilización.",
            causaRaiz: "Falta de coordinación para reducir inactividad de activos.",
            planAccion: "Medir tiempos inactivos y establecer responsables por causa."
        },
        {
            titulo: "Retorno Sin Aprovechamiento",
            porQue2: "El activo retornó sin aprovechar capacidad disponible.",
            porQue3: "No se planificó carga de retorno o actividad complementaria.",
            porQue4: "No hay coordinación con otras áreas para uso de retorno.",
            porQue5: "La operación está diseñada solo para flujo de ida.",
            causaRaiz: "Falta de estrategia de aprovechamiento de retorno.",
            planAccion: "Evaluar oportunidades de logística inversa o retorno productivo."
        }
    ],

    TO: [
        {
            titulo: "Ausentismo",
            porQue2: "Se presentó ausencia de personal clave.",
            porQue3: "No había reemplazo disponible para cubrir la operación.",
            porQue4: "No existe bolsa de respaldo o plan de contingencia.",
            porQue5: "La planeación de personal no contempla variabilidad diaria.",
            causaRaiz: "Falta de plan de cobertura ante ausentismo.",
            planAccion: "Crear matriz de reemplazos y activar personal backup para turnos críticos."
        },
        {
            titulo: "Rotación",
            porQue2: "La operación se afectó por salida de personal entrenado.",
            porQue3: "El personal nuevo no domina el proceso.",
            porQue4: "El entrenamiento no cubre curva de aprendizaje completa.",
            porQue5: "No se gestiona retención de roles críticos.",
            causaRaiz: "Alta rotación sin plan robusto de entrenamiento y retención.",
            planAccion: "Implementar plan de inducción acelerada y seguimiento a nuevos ingresos."
        },
        {
            titulo: "Clima y Liderazgo",
            porQue2: "El equipo presentó baja motivación o compromiso.",
            porQue3: "Hay fricción con liderazgo o condiciones de trabajo.",
            porQue4: "No se gestionan alertas tempranas de clima.",
            porQue5: "La rutina de liderazgo no recoge problemas del equipo.",
            causaRaiz: "Falta de gestión preventiva de clima laboral y liderazgo.",
            planAccion: "Realizar conversación de equipo y plan de mejora con líderes responsables."
        }
    ],

    TR: [
        {
            titulo: "Tiempo Alto en Ruta",
            porQue2: "La ruta tomó más tiempo del esperado.",
            porQue3: "Hubo demoras en clientes o desplazamientos.",
            porQue4: "La programación no consideró restricciones reales.",
            porQue5: "No se revisan desviaciones históricas por ruta.",
            causaRaiz: "Planeación de ruta no ajustada a tiempos reales.",
            planAccion: "Actualizar tiempos estándar por zona y cliente crítico."
        },
        {
            titulo: "Tiempos Muertos",
            porQue2: "Se detectaron tiempos sin actividad productiva en ruta.",
            porQue3: "La tripulación esperó autorización, pago, envase o cliente.",
            porQue4: "No hay gestión preventiva de clientes con demora recurrente.",
            porQue5: "No se clasifican clientes por impacto en tiempo de ruta.",
            causaRaiz: "Falta de gestión de clientes que generan demoras recurrentes.",
            planAccion: "Identificar top clientes con demora y acordar plan de atención."
        },
        {
            titulo: "Secuencia de Ruta",
            porQue2: "La secuencia de entrega generó desplazamientos innecesarios.",
            porQue3: "El ruteo no optimizó orden de visitas.",
            porQue4: "No se actualizó información de restricciones de zona.",
            porQue5: "El sistema de ruteo no recibe feedback operativo diario.",
            causaRaiz: "Información de ruteo desactualizada o poco retroalimentada.",
            planAccion: "Implementar retroalimentación diaria de rutas para ajuste de secuencias."
        }
    ],

    TV: [
        {
            titulo: "Demora en Liquidación",
            porQue2: "La tripulación tardó demasiado al regresar de ruta.",
            porQue3: "Hubo espera para liquidar efectivo, envase o novedades.",
            porQue4: "No había capacidad suficiente en el punto de liquidación.",
            porQue5: "La programación de cierres no está escalonada.",
            causaRaiz: "Falta de capacidad y secuencia en proceso de liquidación.",
            planAccion: "Escalonar horarios de cierre y asignar refuerzo en horas pico."
        },
        {
            titulo: "Novedades al Cierre",
            porQue2: "Las novedades de ruta tomaron demasiado tiempo en resolverse.",
            porQue3: "La información llegó incompleta o desordenada.",
            porQue4: "La tripulación no registró novedades durante la ruta.",
            porQue5: "No existe disciplina de registro en tiempo real.",
            causaRaiz: "Falta de registro oportuno de novedades durante la ruta.",
            planAccion: "Reforzar registro de novedades en ruta y validar antes del regreso."
        },
        {
            titulo: "Conteo de Envase",
            porQue2: "El conteo o validación de envase retrasó el cierre.",
            porQue3: "El proceso fue manual o con diferencias.",
            porQue4: "No se clasificó el envase durante la ruta.",
            porQue5: "No hay rutina estándar para ordenar envase antes de llegada.",
            causaRaiz: "Falta de estandarización del manejo de envase para cierre vespertino.",
            planAccion: "Definir rutina de organización de envase antes de regresar al CD."
        }
    ]
};

// ===============================
// NAVEGACIÓN ENTRE PASOS
// ===============================
const rtaNavigationManager = {
    init() {
        const form = document.getElementById('rta-master-form');
        if (!form) return;

        form.addEventListener('click', (e) => {
            const nextBtn = e.target.closest('.btn-next');
            const prevBtn = e.target.closest('.btn-prev');

            if (nextBtn) {
                this.handleNext(nextBtn);
            } else if (prevBtn) {
                this.handlePrev(prevBtn);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFinalSubmit(e.target);
        });
    },

    handleNext(btn) {
        const currentStep = btn.closest('.rta-step');
        const nextStepId = `step-${btn.dataset.next}`;

        if (this.validateStep(currentStep)) {
            this.switchStep(nextStepId);

            if (nextStepId === 'step-4') {
                rtaAnalysisManager.renderListaNoOK();
            }
        }
    },

    handlePrev(btn) {
        const prevStepId = `step-${btn.dataset.prev}`;
        this.switchStep(prevStepId);
    },

    validateStep(stepContainer) {
        const fields = stepContainer.querySelectorAll('[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!field.checkValidity()) {
                isValid = false;
                field.reportValidity();
            }
        });

        return isValid;
    },

    switchStep(targetStepId) {
        const targetStep = document.getElementById(targetStepId);
        if (!targetStep) return;

        document.querySelectorAll('.rta-step').forEach(step => {
            step.classList.remove('active');
        });

        targetStep.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async handleFinalSubmit(formElement) {
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/rta/guardar-rta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.exito) {
                alert(`✅ ${result.mensaje}`);
                formElement.reset();
                this.switchStep('step-1');
            } else {
                alert(`❌ Error: ${result.mensaje}`);
            }
        } catch (error) {
            console.error("Error en envío RTA:", error);
            alert("❌ Error crítico de conexión al servidor.");
        }
    }
};

// ===============================
// SELECCIÓN DE HALLAZGO NO OK
// ===============================
let selectedNoOK = null;
let sugerenciasActuales = [];

const rtaAnalysisManager = {
    detectarNoOK() {
        const fallos = [];

        for (let i = 1; i <= 3; i++) {
            const resVal = document.getElementById(`resultado-${i}`)?.value;
            const puntoVal = document.getElementById(`punto-${i}`)?.value;

            if (resVal === "NO_OK") {
                fallos.push({
                    id: i,
                    texto: puntoVal || `Punto ${i}`
                });
            }
        }

        return fallos;
    },

    renderListaNoOK() {
        const container = document.getElementById('selection-no-ok-container');
        const sugerenciasContainer = document.getElementById('sugerencias-ia-container');

        if (!container) return;

        const fallos = this.detectarNoOK();

        if (sugerenciasContainer) sugerenciasContainer.innerHTML = "";

        if (fallos.length === 0) {
            container.innerHTML = `
                <div class="feedback-ok">
                    <p>✅ No se detectaron hallazgos NO OK. El análisis puede completarse de forma general.</p>
                </div>
            `;
            selectedNoOK = null;
            return;
        }

        container.innerHTML = `
            <label class="label-gold">HALLAZGO A ANALIZAR (5 PORQUÉS):</label>
            <div class="no-ok-grid" id="no-ok-radio-group"></div>
        `;

        const group = document.getElementById('no-ok-radio-group');

        fallos.forEach(fallo => {
            const label = document.createElement('label');
            label.className = 'no-ok-option';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'selected_hallazgo';
            radio.value = fallo.id;
            radio.dataset.texto = fallo.texto;

            const content = document.createElement('div');
            content.className = 'option-info';
            content.innerHTML = `
                <strong>PUNTO ${fallo.id}</strong>
                <span>${fallo.texto}</span>
            `;

            label.appendChild(radio);
            label.appendChild(content);
            group.appendChild(label);
        });

        group.addEventListener('change', (e) => {
            if (e.target.name === 'selected_hallazgo') {
                selectedNoOK = {
                    id: e.target.value,
                    texto: e.target.dataset.texto
                };

                console.log("Hallazgo seleccionado para análisis:", selectedNoOK);
                renderSugerenciasPorKPI();
            }
        });
    }
};

// ===============================
// SUGERENCIAS POR KPI
// ===============================
function renderSugerenciasPorKPI() {
    const kpiElement = document.getElementById('kpi');
    const contenedor = document.getElementById('sugerencias-ia-container');

    if (!kpiElement || !contenedor) return;

    const kpiValue = kpiElement.value;
    sugerenciasActuales = sugerenciasPorKPI[kpiValue] || [];

    contenedor.innerHTML = '';

    if (!selectedNoOK) {
        contenedor.innerHTML = `
            <p style="color: gray;">Seleccione primero el hallazgo NO OK a analizar.</p>
        `;
        return;
    }

    if (sugerenciasActuales.length === 0) {
        contenedor.innerHTML = `
            <p style="color: gray;">Seleccione un KPI para ver sugerencias.</p>
        `;
        return;
    }

    sugerenciasActuales.forEach((sug, index) => {
        const card = document.createElement('div');
        card.className = 'rta-card-sug';

        card.innerHTML = `
            <div class="rta-card-header">
                <span>💡</span>
                <span class="rta-card-title">${sug.titulo}</span>
            </div>
            <p class="rta-card-preview">${sug.causaRaiz}</p>
            <button type="button" class="btn-select-sug" data-index="${index}">
                Aplicar análisis
            </button>
        `;

        contenedor.appendChild(card);
    });

    contenedor.querySelectorAll('.btn-select-sug').forEach(btn => {
        btn.addEventListener('click', () => {
            aplicarSugerenciaKPI(btn.dataset.index);
        });
    });
}

function aplicarSugerenciaKPI(index) {
    const sug = sugerenciasActuales[index];
    if (!sug) return;

    const hallazgo = selectedNoOK?.texto || "hallazgo identificado";

    const setIfEmpty = (id, value) => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = value;
    };

    setIfEmpty('por-que-1', `Porque no se cumplió: ${hallazgo}`);
    setIfEmpty('por-que-2', sug.porQue2);
    setIfEmpty('por-que-3', sug.porQue3);
    setIfEmpty('por-que-4', sug.porQue4);
    setIfEmpty('por-que-5', sug.porQue5);
    setIfEmpty('causa-raiz', sug.causaRaiz);
    setIfEmpty('plan-accion', sug.planAccion);

    console.log("Sugerencia aplicada:", sug);
}

// ===============================
// INIT
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    rtaNavigationManager.init();

    const kpiElement = document.getElementById('kpi');
    if (kpiElement) {
        kpiElement.addEventListener('change', () => {
            if (selectedNoOK) {
                renderSugerenciasPorKPI();
            }
        });
    }
});