require('dotenv').config();
const mongoose = require('mongoose');
const KpiConfig = require('../models/KpiConfig');

/**
 * Matriz de Configuración Maestra - Módulo 1.1 Desempeño PI y KPI
 * Define metas, disparadores y lógica de cumplimiento para la Gerencia Valle.
 */
const kpis = [
    {
        indicador_pi: "Cashless Incumplidos",
        kpi_impactado: "TRI",
        mongo_field: "cashless_incumplidos",
        display_format: "NUMBER",
        unidad: "#",
        meta: 0,
        disparador: 3,
        direccion_logica: "MENOR_ES_MEJOR", // 0 Verde, 1-2 Rojo, >=3 Azul
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Gestión del Día Anterior"
    },
    {
        indicador_pi: "Modulacion por placa",
        kpi_impactado: "OTIF",
        mongo_field: "modulacion_por_placa",
        display_format: "PERCENT",
        unidad: "%",
        meta: 90,
        disparador: 80,
        direccion_logica: "MAYOR_ES_MEJOR", // >=90 Verde, 81-89 Rojo, <=80 Azul
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Análisis de Modulaciones"
    },
    {
        indicador_pi: "Salidas primeros viajes",
        kpi_impactado: "OTIF",
        mongo_field: "salidas_primeros_viajes",
        display_format: "HH_MM",
        unidad: "Hora",
        meta: 390, // Corresponde a las 06:30 (6*60 + 30)
        disparador: 510, // Corresponde a las 08:30 (8*60 + 30)
        direccion_logica: "MENOR_ES_MEJOR", // Temprano Verde, Tarde Azul
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Control de Salida"
    },
    {
        indicador_pi: "SAC Atribuibles UC",
        kpi_impactado: "NPS",
        mongo_field: "sac_atribuibles_uc",
        display_format: "NUMBER",
        unidad: "#",
        meta: 1,
        disparador: 2,
        direccion_logica: "MENOR_ES_MEJOR",
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Análisis de Servicio"
    },
    {
        indicador_pi: "Tiempo de atencion en PDV",
        kpi_impactado: "ON TIME",
        mongo_field: "tiempo_de_atencion_en_pdv",
        display_format: "NUMBER",
        unidad: "Min",
        meta: 18,
        disparador: 22,
        direccion_logica: "MENOR_ES_MEJOR",
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Gestión de Tiempos"
    },
    {
        indicador_pi: "Paradas no planeadas",
        kpi_impactado: "VLC",
        mongo_field: "paradas_no_planeadas",
        display_format: "NUMBER",
        unidad: "#",
        meta: 0,
        disparador: 3,
        direccion_logica: "MENOR_ES_MEJOR",
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Seguimiento GPS"
    },
    {
        indicador_pi: "Adherencia al check-list",
        kpi_impactado: "DISPONIBILIDAD DE FLOTA",
        mongo_field: "adherencia_al_check_list",
        display_format: "PERCENT",
        unidad: "%",
        meta: 100,
        disparador: 95,
        direccion_logica: "MAYOR_ES_MEJOR", // 100 Verde, 96-99 Rojo, <=95 Azul
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Checklist de Flota"
    },
    {
        indicador_pi: "Entrega en rangos",
        kpi_impactado: "ON TIME",
        mongo_field: "entrega_en_rangos",
        display_format: "PERCENT",
        unidad: "%",
        meta: 90,
        disparador: 85,
        direccion_logica: "MAYOR_ES_MEJOR",
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Gestión del Día Anterior"
    },
    {
        indicador_pi: "Rechazos TAT logistico",
        kpi_impactado: "INFULL",
        mongo_field: "rechazos_tat_logistico",
        display_format: "NUMBER",
        unidad: "Cajas",
        meta: 30,
        disparador: 50,
        direccion_logica: "MENOR_ES_MEJOR",
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Análisis de Rechazos"
    },
    {
        indicador_pi: "Cantidad de rutas mayor a 10 HR",
        kpi_impactado: "TRI",
        mongo_field: "cantidad_de_rutas_mayor_a_10_hr",
        display_format: "NUMBER",
        unidad: "#",
        meta: 2,
        disparador: 4,
        direccion_logica: "MENOR_ES_MEJOR",
        aplicabilidad: ["CALI", "POPAYAN", "TULUA"],
        herramienta_gestion: "Control de Jornada"
    }
];

/**
 * Función de ejecución del SEED
 */
async function seedKpiConfig() {
    try {
        console.log('🌱 Iniciando siembra de KpiConfig...');
        
        // Conexión a la base de datos
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión establecida con MongoDB.');

        // Limpiar la colección existente para evitar duplicados o basura de pruebas
        const deleted = await KpiConfig.deleteMany({});
        console.log(`🗑️ Se eliminaron ${deleted.deletedCount} registros previos.`);

        // Insertar la nueva matriz de configuración
        const inserted = await KpiConfig.insertMany(kpis);
        console.log(`🚀 ¡Éxito! Se han insertado ${inserted.length} configuraciones de KPIs.`);

    } catch (error) {
        console.error('❌ Error durante la siembra de datos:', error);
    } finally {
        // Cerrar la conexión siempre
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada.');
        process.exit(0);
    }
}

// Ejecutar el script
seedKpiConfig();