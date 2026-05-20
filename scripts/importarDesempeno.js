/**
 * SCRIPT: importarDesempeno.js
 * Ruta: scripts/importarDesempeno.js
 * Descripción: Importación masiva de KPIs desde Excel a MongoDB Atlas.
 * Auditoría QA:
 * - Eliminación completa de processTime().
 * - tiempo_de_atencion_en_pdv cargado con cleanNumeric().
 * - salidas_primeros_viajes cargado con cleanNumeric() como porcentaje plano.
 * - Formateo manual de fecha sin toISOString() para evitar desvíos horarios.
 * - semana/anio tipificados a Number con validación isNaN.
 * - Upsert con $set completo incluyendo llaves quíntuples.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const DesempenoKpi = require('../models/DesempenoKpi');

const MONGO_URI = process.env.MONGO_URI;
const FILE_PATH = path.join(__dirname, '../data/kpis.xlsx');

/**
 * Normaliza el nombre del CD a MAYÚSCULAS y elimina tildes
 */
function normalizarCD(cd) {
    if (!cd) return null;
    return cd.trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); 
}

/**
 * Parsea fechas de Excel usando SSF y formateo manual libre de toISOString()
 */
function parseFecha(val) {
    if (!val) return null;
    try {
        if (typeof val === 'number') {
            const dateObj = xlsx.SSF.parse_date_code(val);
            const yyyy = dateObj.y;
            const mm = String(dateObj.m).padStart(2, '0');
            const dd = String(dateObj.d).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } else {
            const s = String(val).trim();
            if (s.includes('-')) {
                const parts = s.split('T')[0].split('-');
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (s.includes('/')) {
                const [dia, mes, anio] = s.split('/');
                return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Limpia valores numéricos y normaliza porcentajes en formato decimal (0.70 -> 70)
 * Conserva el valor NULL de manera estricta si la celda viene vacía o es 'N/A'
 */
function cleanNumeric(val) {
    if (val === undefined || val === null || String(val).trim() === '' || String(val).toUpperCase() === 'N/A') {
        return null; 
    }
    let strVal = String(val).replace('%', '').replace(',', '.').trim();
    let num = parseFloat(strVal);
    
    if (isNaN(num)) return null;

    // Normalización: si el valor es decimal menor a 1 (ej: 0.85) se almacena como entero (85)
    if (num > 0 && num < 1) return Math.round(num * 100);
    
    return num;
}

async function ejecutarImportacion() {
    console.time('Tiempo de Ejecución');
    try {
        if (!MONGO_URI) throw new Error("La variable MONGO_URI no está definida.");
        await mongoose.connect(MONGO_URI);

        if (!fs.existsSync(FILE_PATH)) throw new Error(`Archivo no encontrado en: ${FILE_PATH}`);

        const workbook = xlsx.readFile(FILE_PATH);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        let operaciones = [];
        let stats = { total: rawData.length, procesados: 0, errores: 0 };

        for (const fila of rawData) {
            // Conversiones de Identificación de Llaves Quíntuples primarias
            const fecha = parseFecha(fila['FECHA'] || fila['Fecha']);
            const cd = normalizarCD(fila['CD'] || fila['Centro de Distribución']);
            const placa = String(fila['PLACA'] || fila['Placa'] || "").trim().toUpperCase();
            const cc_conductor = String(fila['CC CONDUCTOR'] || fila['Cc Conductor'] || "").trim();
            const cc_responsable_ruta = String(fila['CC RESPONSABLE RUTA'] || fila['Cc Responsable'] || "").trim();
            
            // Tratamiento numérico estricto para tiempos y agrupaciones cronológicas
            const semanaRaw = fila['Semana'] || fila['SEMANA'];
            const semana = parseInt(semanaRaw, 10);
            const anio = fecha ? parseInt(fecha.split('-')[0], 10) : null;

            // Validación estricta QA contra semanas inválidas (NaN) o llaves nulas
            if (!fecha || !cd || !placa || !cc_conductor || !cc_responsable_ruta || isNaN(semana)) {
                stats.errores++;
                continue;
            }

            const updateFields = {
                // Llaves primarias de identificación incluidas en el $set para evitar registros huérfanos
                cd,
                fecha,
                semana,
                anio,
                placa,
                cc_conductor,
                cc_responsable_ruta,

                // Nombres exactos del modelo para la tripulación (sin conectores de/de_la)
                cc_auxiliar_1: fila['CC AUXILIAR 1'] ? String(fila['CC AUXILIAR 1']).trim() : null,
                cc_auxiliar_2: fila['CC AUXILIAR 2'] ? String(fila['CC AUXILIAR 2']).trim() : null,
                nombre_conductor: fila['NOMBRE CONDUCTOR'] ? String(fila['NOMBRE CONDUCTOR']).trim() : null,
                nombre_responsable_ruta: fila['NOMBRE RESPONSABLE DE RUTA'] ? String(fila['NOMBRE RESPONSABLE DE RUTA']).trim() : null,
                nombre_auxiliar_reparto: fila['NOMBRE AUXILIAR DE REPARTO'] ? String(fila['NOMBRE AUXILIAR DE REPARTO']).trim() : null,
                transporte: fila['TRANSPORTE'] ? String(fila['TRANSPORTE']).trim() : null,

                // Ingesta de KPIs tradicionales usando cleanNumeric() plano
                cashless_incumplidos: cleanNumeric(fila['Cashless Incumplidos']),
                modulacion_por_placa: cleanNumeric(fila['Modulacion por placa']),
                sac_atribuibles_uc: cleanNumeric(fila['SAC Atribuibles UC']),
                tiempo_de_atencion_en_pdv: cleanNumeric(fila['Tiempo de atencion en PDV']), // Corregido: número directo sin multiplicación
                paradas_no_planeadas: cleanNumeric(fila['Paradas no planeadas']),
                adherencia_al_check_list: cleanNumeric(fila['Adherencia al check-list']),
                salidas_primeros_viajes: cleanNumeric(fila['Salidas primeros viajes']), // Porcentaje plano
                entrega_en_rangos: cleanNumeric(fila['Entrega en rangos']),
                rechazos_tat_logistico: cleanNumeric(fila['Rechazos TAT logistico']),
                
                // Mantenido únicamente por compatibilidad histórica de la estructura de datos
                cantidad_de_rutas_mayor_a_10_hr: cleanNumeric(fila['Cantidad de rutas mayor a 10 HR']),

                // Nuevos campos operacionales
                recargues: cleanNumeric(fila['Recargues']),
                descanso_efectivo: cleanNumeric(fila['Descanso Efectivo']),
                ausentismo: cleanNumeric(fila['Ausentismo']),
            };

            operaciones.push({
                updateOne: {
                    // Filtro quíntuple original de la operación logística
                    filter: { cd, fecha, placa, cc_conductor, cc_responsable_ruta },
                    update: { $set: updateFields },
                    upsert: true
                }
            });
            stats.procesados++;
        }

        if (operaciones.length > 0) {
            const res = await DesempenoKpi.bulkWrite(operaciones);
            console.log('--- REPORTE FINAL OPERATIVO DE CARGA ---');
            console.log(`- Registros leídos en Excel: ${stats.total}`);
            console.log(`- Registros procesados válidos: ${stats.procesados}`);
            console.log(`- Registros rechazados/omitidos: ${stats.errores}`);
            console.log(`- Documentos creados (Upsert): ${res.upsertedCount}`);
            console.log(`- Documentos modificados (Update): ${res.modifiedCount}`);
            console.log('-------------------------------------------');
        }

    } catch (err) {
        console.error('❌ ERROR OPERACIONAL DURANTE IMPORTACIÓN:', err.message);
    } finally {
        await mongoose.disconnect();
        console.timeEnd('Tiempo de Ejecución');
    }
}

ejecutarImportacion();