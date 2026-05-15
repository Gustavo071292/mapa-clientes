/**
 * SCRIPT: importarDesempeno.js
 * Descripción: Importación masiva de KPIs desde Excel a MongoDB Atlas.
 * Auditoría QA: 
 * - Salida Primer Viaje como Porcentaje (Number).
 * - semana/anio como Number con validación isNaN.
 * - Upsert con $set completo para integridad.
 * - Normalización de CDs a MAYÚSCULAS sin tildes.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const DesempenoKpi = require('../models/DesempenoKpi');

// Uso estricto de la variable de entorno de la arquitectura original
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
 * Parsea fechas de Excel usando SSF para evitar desfases de zona horaria
 */
function parseFecha(val) {
    if (!val) return null;
    try {
        let d;
        if (typeof val === 'number') {
            // Uso de la arquitectura original de xlsx
            const dateObj = xlsx.SSF.parse_date_code(val);
            return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
        } else {
            const s = String(val).trim();
            if (s.includes('-')) {
                d = new Date(s + "T00:00:00");
            } else if (s.includes('/')) {
                const [dia, mes, anio] = s.split('/');
                d = new Date(anio, mes - 1, dia);
            }
        }
        return (d && !isNaN(d)) ? d.toISOString().split('T')[0] : null;
    } catch (e) {
        return null;
    }
}

/**
 * Limpia valores numéricos y normaliza porcentajes (0.7 -> 70)
 * Mantiene NULL si el dato está vacío.
 */
function cleanNumeric(val) {
    if (val === undefined || val === null || String(val).trim() === '' || String(val).toUpperCase() === 'N/A') {
        return null; 
    }
    let strVal = String(val).replace('%', '').replace(',', '.').trim();
    let num = parseFloat(strVal);
    
    if (isNaN(num)) return null;

    // Normalización: si el valor es decimal (ej. 0.85) se guarda como entero (85)
    if (num > 0 && num < 1) return Math.round(num * 100);
    
    return num;
}

/**
 * Procesa tiempos en minutos (Solo para Tiempo de atención en PDV)
 */
function processTime(val) {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return Math.round(val * 24 * 60);
    const parts = String(val).split(':');
    if (parts.length >= 2) return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    return cleanNumeric(val);
}

async function ejecutarImportacion() {
    console.time('Tiempo de Ejecución');
    try {
        if (!MONGO_URI) throw new Error("La variable MONGO_URI no está definida en .env");
        
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conexión exitosa a MongoDB Atlas');

        if (!fs.existsSync(FILE_PATH)) throw new Error(`No se encontró el archivo en: ${FILE_PATH}`);

        const workbook = xlsx.readFile(FILE_PATH);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        let operaciones = [];
        let stats = { total: rawData.length, procesados: 0, errores: 0 };

        for (const fila of rawData) {
            // Identificadores de fila
            const fecha = parseFecha(fila['FECHA'] || fila['Fecha']);
            const cd = normalizarCD(fila['CD'] || fila['Centro de Distribución']);
            const placa = String(fila['PLACA'] || fila['Placa'] || "").trim().toUpperCase();
            const cc_conductor = String(fila['CC CONDUCTOR'] || fila['Cc Conductor'] || "").trim();
            const cc_responsable_ruta = String(fila['CC RESPONSABLE RUTA'] || fila['Cc Responsable'] || "").trim();
            
            // Auditoría QA: Conversión estricta a Number
            const semanaRaw = fila['Semana'] || fila['SEMANA'];
            const semana = parseInt(semanaRaw, 10);
            const anio = fecha ? parseInt(fecha.split('-')[0], 10) : null;

            // Validación de integridad y seguridad contra NaN en semana
            if (!fecha || !cd || !placa || !cc_conductor || !cc_responsable_ruta || isNaN(semana)) {
                stats.errores++;
                continue;
            }

            // Mapeo técnico respetando nombres de campos existentes
            const updateFields = {
                // Llaves de identificación (deben estar en $set para upsert correcto)
                cd,
                fecha,
                semana,
                anio,
                placa,
                cc_conductor,
                cc_responsable_ruta,
                // Indicadores KPI
                cashless_incumplidos: cleanNumeric(fila['Cashless Incumplidos']),
                modulacion_por_placa: cleanNumeric(fila['Modulacion por placa'] || fila['Modulación']),
                sac_atribuibles_uc: cleanNumeric(fila['SAC Atribuibles UC']),
                tiempo_de_atencion_en_pdv: processTime(fila['Tiempo de atencion en PDV']),
                paradas_no_planeadas: cleanNumeric(fila['Paradas no planeadas']),
                adherencia_al_check_list: cleanNumeric(fila['Adherencia al check-list']),
                // KPI Corregido: Ya NO usa processTime, se guarda como porcentaje numérico
                salidas_primeros_viajes: cleanNumeric(
                    fila['Salidas primeros viajes'] || 
                    fila['Salida de vehiculos antes de 8:30'] || 
                    fila['Salida de vehículos antes de 8:30'] || 
                    fila['Salida Primer Viaje']
                ),
                entrega_en_rangos: cleanNumeric(fila['Entrega en rangos'] || fila['Entrega en rango']),
                rechazos_tat_logistico: cleanNumeric(fila['Rechazos TAT logistico']),
                cantidad_de_rutas_mayor_a_10_hr: cleanNumeric(fila['Cantidad de rutas mayor a 10 HR']),
                transporte: fila['TRANSPORTE'],
                nombre_conductor: fila['NOMBRE CONDUCTOR'],
                nombre_responsable_ruta: fila['NOMBRE RESPONSABLE DE RUTA'] || null,
            };

            operaciones.push({
                updateOne: {
                    // Filtro de 5 campos según arquitectura actual
                    filter: { cd, fecha, placa, cc_conductor, cc_responsable_ruta },
                    update: { $set: updateFields },
                    upsert: true
                }
            });
            stats.procesados++;
        }

        if (operaciones.length > 0) {
            const res = await DesempenoKpi.bulkWrite(operaciones);
            console.log('--- REPORTE QA IMPORTACIÓN ---');
            console.log(`- Filas en Excel: ${stats.total}`);
            console.log(`- Procesados exitosamente: ${stats.procesados}`);
            console.log(`- Errores/Omitidos (NaN o vacíos): ${stats.errores}`);
            console.log(`- Registros Nuevos: ${res.upsertedCount}`);
            console.log(`- Registros Actualizados: ${res.modifiedCount}`);
            console.log('------------------------------');
        }

    } catch (err) {
        console.error('❌ ERROR DURANTE LA IMPORTACIÓN:', err.message);
    } finally {
        await mongoose.disconnect();
        console.timeEnd('Tiempo de Ejecución');
    }
}

ejecutarImportacion();