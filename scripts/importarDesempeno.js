require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const DesempenoKpi = require('../models/DesempenoKpi');

// Ruta exacta según arquitectura aprobada
const FILE_PATH = path.join(__dirname, '../data/kpis.xlsx');

/**
 * QA: Limpieza estricta de valores.
 * No convierte vacíos a 0 para no sesgar indicadores.
 */
function cleanValue(val) {
    if (val === undefined || val === null || val === '') return null;
    const strVal = String(val).trim().toUpperCase();
    if (strVal === 'N/A' || strVal === 'NULL' || strVal === 'UNDEFINED') return null;
    
    const num = Number(val);
    return isNaN(num) ? null : num;
}

/**
 * QA: Normalización robusta de FECHA.
 * Soporta número de serie Excel, objetos Date y Strings.
 */
function normalizeFecha(val) {
    try {
        if (!val) return null;
        
        let dateObj;
        if (typeof val === 'number') {
            // Caso: Número serie de Excel (e.g. 45420)
            dateObj = xlsx.SSF.parse_date_code(val);
            return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
        } else if (val instanceof Date) {
            // Caso: Objeto Date nativo
            dateObj = val;
        } else {
            // Caso: String (intentar parsear)
            dateObj = new Date(val);
        }

        if (isNaN(dateObj.getTime())) return null;
        return dateObj.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

/**
 * QA: Gestión de Tiempos (Salidas primeros viajes).
 * Convierte a minutos para lógica y genera label HH:MM para visualización.
 */
function processTime(val) {
    if (val === undefined || val === null || val === '') return { minutes: null, label: null };
    
    let totalMinutes = 0;
    let label = "";

    try {
        if (typeof val === 'number') {
            // Excel guarda horas como fracción de día (e.g. 0.270833 para 06:30)
            totalMinutes = Math.round(val * 24 * 60);
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            label = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        } else {
            // Caso: String "HH:MM" o "HH:MM:SS"
            const parts = String(val).trim().split(':');
            if (parts.length < 2) return { minutes: null, label: null };
            const hrs = parseInt(parts[0]);
            const mins = parseInt(parts[1]);
            totalMinutes = (hrs * 60) + mins;
            label = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        }
        return { minutes: totalMinutes, label: label };
    } catch (e) {
        return { minutes: null, label: null };
    }
}

async function runImport() {
    try {
        console.log('🚀 Iniciando importación de Desempeño KPI...');
        await mongoose.connect(process.env.MONGO_URI);

        if (!fs.existsSync(FILE_PATH)) {
            console.error('❌ Error: No se encontró el archivo en uploads/kpis.xlsx');
            process.exit(1);
        }

        const workbook = xlsx.readFile(FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`📊 Leídas ${data.length} filas del Excel.`);

        const operations = [];
        let skippedCount = 0;

        data.forEach((row, index) => {
            // Normalización de CD y exclusión de Yumbo
            const rawCD = String(row['CD'] || '').trim().toUpperCase();
            if (!['CALI', 'POPAYAN', 'TULUA'].includes(rawCD)) {
                skippedCount++;
                return;
            }

            // Normalización de campos clave para el índice único
            const fechaNorm = normalizeFecha(row['FECHA']);
            const placa = String(row['PLACA'] || '').trim().toUpperCase();
            const ccConductor = String(row['CC CONDUCTOR'] || '').trim();
            const ccResponsable = String(row['CC RESPONSABLE RUTA'] || '').trim();

            // QA: Omitir si faltan datos de identidad o fecha
            if (!fechaNorm || !placa || !ccConductor || !ccResponsable) {
                skippedCount++;
                return;
            }

            // Procesamiento de indicador de tiempo
            const timeData = processTime(row['Salidas primeros viajes']);

            operations.push({
                updateOne: {
                    filter: { 
                        cd: rawCD, 
                        fecha: fechaNorm, 
                        placa: placa, 
                        cc_conductor: ccConductor, 
                        cc_responsable_ruta: ccResponsable 
                    },
                    update: {
                        $set: {
                            cd: rawCD,
                            fecha: fechaNorm,
                            transporte: row['TRANSPORTE'] || null,
                            placa: placa,
                            cc_conductor: ccConductor,
                            cc_responsable_ruta: ccResponsable,
                            cc_auxiliar_1: String(row['CC AUXILIAR 1'] || '').trim() || null,
                            cc_auxiliar_2: String(row['CC AUXILIAR 2'] || '').trim() || null,
                            nombre_conductor: row['NOMBRE CONDUCTOR'] || null,
                            nombre_responsable_ruta: row['NOMBRE RESPONSABLE DE RUTA'] || null,
                            nombre_auxiliar_reparto: row['NOMBRE AUXILIAR DE REPARTO'] || null,

                            // KPIs Reales con limpieza de nulos
                            cashless_incumplidos: cleanValue(row['Cashless Incumplidos']),
                            modulacion_por_placa: cleanValue(row['Modulacion por placa']),
                            sac_atribuibles_uc: cleanValue(row['SAC Atribuibles UC']),
                            tiempo_de_atencion_en_pdv: cleanValue(row['Tiempo de atencion en PDV']),
                            paradas_no_planeadas: cleanValue(row['Paradas no planeadas']),
                            adherencia_al_check_list: cleanValue(row['Adherencia al check-list']),
                            salidas_primeros_viajes: timeData.minutes,
                            salidas_primeros_viajes_label: timeData.label,
                            entrega_en_rangos: cleanValue(row['Entrega en rangos']),
                            rechazos_tat_logistico: cleanValue(row['Rechazos TAT logistico']),
                            cantidad_de_rutas_mayor_a_10_hr: cleanValue(row['Cantidad de rutas mayor a 10 HR'])
                        }
                    },
                    upsert: true
                }
            });
        });

        if (operations.length > 0) {
            const result = await DesempenoKpi.bulkWrite(operations);
            console.log('-------------------------------------------');
            console.log('✅ PROCESO COMPLETADO');
            console.log(`- Registros procesados: ${operations.length}`);
            console.log(`- Registros omitidos (Yumbo/Inválidos): ${skippedCount}`);
            console.log(`- Nuevos/Actualizados en BD: ${result.upsertedCount + result.modifiedCount}`);
            console.log('-------------------------------------------');
        } else {
            console.log('⚠️ No se encontraron registros válidos para importar.');
        }

    } catch (error) {
        console.error('❌ Error crítico durante la importación:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runImport();