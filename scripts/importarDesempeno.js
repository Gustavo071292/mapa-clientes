require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const DesempenoKpi = require('../models/DesempenoKpi');

const FILE_PATH = path.join(__dirname, '../data/kpis.xlsx');

function cleanValue(val) {
    if (val === undefined || val === null || val === '' || String(val).trim().toUpperCase() === 'N/A') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
}

function processTime(val) {
    if (!val) return { minutes: null, label: null };
    let mins = 0, label = "";
    if (typeof val === 'number') {
        mins = Math.round(val * 24 * 60);
        const h = Math.floor(mins / 60), m = mins % 60;
        label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else {
        const p = String(val).split(':');
        if (p.length < 2) return { minutes: null, label: null };
        mins = (parseInt(p[0]) * 60) + parseInt(p[1]);
        label = `${String(p[0]).padStart(2, '0')}:${String(p[1]).padStart(2, '0')}`;
    }
    return { minutes: mins, label: label };
}

async function runImport() {
    try {
        console.log('🚀 Iniciando importación operativa desde data/kpis.xlsx...');
        await mongoose.connect(process.env.MONGO_URI);
        
        if (!fs.existsSync(FILE_PATH)) {
            console.error('❌ Error: Archivo no encontrado.');
            process.exit(1);
        }

        const workbook = xlsx.readFile(FILE_PATH);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const operations = [];

        data.forEach((row, index) => {
            const rawCD = String(row['CD'] || '').trim().toUpperCase();
            if (!['CALI', 'POPAYAN', 'TULUA'].includes(rawCD)) return;

            const numSemana = parseInt(row['Semana']);
            if (isNaN(numSemana)) return;

            let fechaISO = row['FECHA'];
            if (typeof row['FECHA'] === 'number') {
                const d = xlsx.SSF.parse_date_code(row['FECHA']);
                fechaISO = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            }
            if (!fechaISO) return;
            const anio = parseInt(fechaISO.split('-')[0]);

            const ccCond = String(row['CC CONDUCTOR'] || '').trim();
            const ccResp = String(row['CC RESPONSABLE RUTA'] || '').trim();
            const placa = String(row['PLACA'] || '').trim().toUpperCase();

            // QA: Validación de integridad obligatoria
            if (!ccCond || !ccResp || !placa || !fechaISO || !anio) return;

            const timeData = processTime(row['Salidas primeros viajes']);

            operations.push({
                updateOne: {
                    filter: { cd: rawCD, fecha: fechaISO, placa, cc_conductor: ccCond, cc_responsable_ruta: ccResp },
                    update: {
                        $set: {
                            cd: rawCD,
                            fecha: fechaISO,
                            semana: numSemana,
                            anio: anio,
                            transporte: row['TRANSPORTE'] || null,
                            placa,
                            cc_conductor: ccCond,
                            cc_responsable_ruta: ccResp,
                            nombre_conductor: row['NOMBRE CONDUCTOR'] || null,
                            nombre_responsable_ruta: row['NOMBRE RESPONSABLE DE RUTA'] || null,
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
            console.log(`✅ Carga finalizada: ${result.upsertedCount + result.modifiedCount} registros.`);
        }
    } catch (e) { console.error(e); } finally { mongoose.connection.close(); process.exit(0); }
}
runImport();