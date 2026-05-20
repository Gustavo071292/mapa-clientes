/**
 * SCRIPT: seedKpiConfig.js
 * Ruta: scripts/seedKpiConfig.js
 * Descripción: Inicialización limpia de metas y operadores de control operacional 2026.
 * Corrección QA: Se reemplaza de forma definitiva HERHERRAMIENTA por HERRAMIENTA.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const KpiConfig = require('../models/KpiConfig');

const MONGO_URI = process.env.MONGO_URI;
const ALL_CDS = ['CALI', 'POPAYAN', 'TULUA'];
const HERRAMIENTA = "Gestión del Día Anterior";

const configuracionesOFICIALES = [
    {
        kpi_impactado: "TRI",
        indicador_pi: "Cashless Incumplidos",
        mongo_field: "cashless_incumplidos",
        unidad: "#",
        meta: 0,
        meta_operador: "<",
        disparador: 2,
        disparador_operador: "<=",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "OTIF",
        indicador_pi: "Modulaciones",
        mongo_field: "modulacion_por_placa",
        unidad: "%",
        meta: 90,
        meta_operador: ">=",
        disparador: 80,
        disparador_operador: "<=",
        direccion_logica: "MAYOR_ES_MEJOR",
        display_format: "PERCENT",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "OTIF",
        indicador_pi: "Salida Primer Viaje",
        mongo_field: "salidas_primeros_viajes",
        unidad: "%",
        meta: 70,
        meta_operador: ">=",
        disparador: 60,
        disparador_operador: "<=",
        direccion_logica: "MAYOR_ES_MEJOR",
        display_format: "PERCENT",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "NPS",
        indicador_pi: "SAC Atribuibles al UC",
        mongo_field: "sac_atribuibles_uc",
        unidad: "#",
        meta: 1,
        meta_operador: "<=",
        disparador: 2,
        disparador_operador: ">=",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "ON TIME",
        indicador_pi: "Tiempo de atencion en PDV",
        mongo_field: "tiempo_de_atencion_en_pdv",
        unidad: "Minutos",
        meta: 18,
        meta_operador: "<=",
        disparador: 28,
        disparador_operador: ">=",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "VLC",
        indicador_pi: "Paradas no planeadas",
        mongo_field: "paradas_no_planeadas",
        unidad: "#",
        meta: 3,
        meta_operador: "<=",
        disparador: 6,
        disparador_operador: ">=",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "DISPONIBILIDAD DE FLOTA",
        indicador_pi: "Adherencia al check-list",
        mongo_field: "adherencia_al_check_list",
        unidad: "%",
        meta: 99,
        meta_operador: ">",
        disparador: 95,
        disparador_operador: "<",
        direccion_logica: "MAYOR_ES_MEJOR",
        display_format: "PERCENT",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "ON TIME",
        indicador_pi: "Entrega en rango",
        mongo_field: "entrega_en_rangos",
        unidad: "%",
        meta: 90,
        meta_operador: ">=",
        disparador: 85,
        disparador_operador: "<=",
        direccion_logica: "MAYOR_ES_MEJOR",
        display_format: "PERCENT",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "INFULL",
        indicador_pi: "Rechazos TAT Logisticos",
        mongo_field: "rechazos_tat_logistico",
        unidad: "# cajas",
        meta: 30,
        meta_operador: "<=",
        disparador: 50,
        disparador_operador: ">=",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "TRI",
        indicador_pi: "Descanso efectivo",
        mongo_field: "descanso_efectivo",
        unidad: "#",
        meta: 1,
        meta_operador: "<=",
        disparador: 3,
        disparador_operador: ">=",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "Total Productivity",
        indicador_pi: "Recargues",
        mongo_field: "recargues",
        unidad: "#",
        meta: 3,
        meta_operador: ">=",
        disparador: 1,
        disparador_operador: "<=",
        direccion_logica: "MAYOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "TURNOVER",
        indicador_pi: "Ausentismo",
        mongo_field: "ausentismo",
        unidad: "#",
        meta: 1,
        meta_operador: "<=",
        disparador: 3,
        disparador_operador: ">",
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    }
];

async function seedConfig() {
    console.log('--- INICIANDO ACTUALIZACIÓN DE OPERADORES MAESTROS ---');
    try {
        if (!MONGO_URI) throw new Error("La variable MONGO_URI no está definida.");
        await mongoose.connect(MONGO_URI);

        await KpiConfig.deleteMany({});
        console.log('🧹 Catálogo maestro vaciado de forma correcta.');
        
        for (const config of configuracionesOFICIALES) {
            await KpiConfig.create(config);
        }
        console.log('🚀 Configuración maestra limpia y mapeada de forma exitosa.');
    } catch (e) {
        console.error('❌ ERROR CRÍTICO EN SEED:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}

seedConfig();