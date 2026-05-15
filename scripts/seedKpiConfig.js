/**
 * SCRIPT: seedKpiConfig.js
 * Descripción: Configuración maestra de metas, formatos y lógica de KPIs 2026.
 * Auditoría QA:
 * - direccion_logica: MAYOR_ES_MEJOR / MENOR_ES_MEJOR.
 * - aplicabilidad: Array de CDs ['CALI', 'POPAYAN', 'TULUA', 'YUMBO'].
 * - herramienta_gestion: "Gestión del Día Anterior".
 * - display_format: Ajustado para Tiempo PDV (NUMBER).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const KpiConfig = require('../models/KpiConfig');

// Uso estricto de la variable de entorno de la arquitectura original
const MONGO_URI = process.env.MONGO_URI;

// Configuración de alcance global para los CDs
const ALL_CDS = ['CALI', 'POPAYAN', 'TULUA', 'YUMBO'];
const HERRAMIENTA = "Gestión del Día Anterior";

const configuraciones = [
    {
        kpi_impactado: "TRI",
        indicador_pi: "Cashless Incumplidos",
        mongo_field: "cashless_incumplidos",
        unidad: "#",
        meta: 1,
        disparador: 2,
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "OTIF",
        indicador_pi: "Modulacion por placa",
        mongo_field: "modulacion_por_placa",
        unidad: "%",
        meta: 90,
        disparador: 80,
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
        disparador: 60,
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
        disparador: 2,
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
        disparador: 25,
        direccion_logica: "MENOR_ES_MEJOR",
        // Ajustado a NUMBER según auditoría (unidad es Minutos)
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
        disparador: 6,
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
        disparador: 95,
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
        disparador: 85,
        direccion_logica: "MAYOR_ES_MEJOR",
        display_format: "PERCENT",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "INFULL",
        indicador_pi: "Rechazos TAT Logisticos",
        mongo_field: "rechazos_tat_logistico",
        unidad: "Cajas",
        meta: 30,
        disparador: 50,
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    },
    {
        kpi_impactado: "TRI",
        indicador_pi: "Cantidad de rutas mayor a 10Hrs",
        mongo_field: "cantidad_de_rutas_mayor_a_10_hr",
        unidad: "#",
        meta: 2,
        disparador: 4,
        direccion_logica: "MENOR_ES_MEJOR",
        display_format: "NUMBER",
        aplicabilidad: ALL_CDS,
        herramienta_gestion: HERRAMIENTA
    }
];

async function seedConfig() {
    console.log('--- INICIANDO ACTUALIZACIÓN DE CONFIGURACIÓN ---');
    try {
        if (!MONGO_URI) throw new Error("La variable MONGO_URI no está definida.");
        
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conexión establecida para Seed');

        for (const config of configuraciones) {
            await KpiConfig.updateOne(
                { mongo_field: config.mongo_field },
                { $set: config },
                { upsert: true }
            );
            console.log(`- Sincronizado: ${config.indicador_pi}`);
        }

        console.log('🚀 Configuración de KPIs actualizada exitosamente.');

    } catch (error) {
        console.error('❌ ERROR EN SEED:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('--- PROCESO FINALIZADO ---');
    }
}

seedConfig();