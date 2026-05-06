require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const EjecucionKpi = require('../models/EjecucionKpi');

const DATA_PATH = path.join(__dirname, '../data');
const FILE_NAME = 'Bloque 1.xlsx'; // Nombre actualizado según QA
const YEAR_IMPORT = 2026;

/**
 * Normaliza el mes a formato MM (01-12) soportando número o texto
 */
function normalizeMes(val) {
    if (!val) return null;
    
    const mesesMap = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    const strVal = String(val).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Si ya es número o texto de mes
    if (mesesMap[strVal]) return mesesMap[strVal];
    
    // Si es número (ej: 5 o "05")
    const num = parseInt(strVal);
    if (!isNaN(num) && num >= 1 && num <= 12) {
        return String(num).padStart(2, '0');
    }
    
    return null;
}

async function runImport() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const filePath = path.join(DATA_PATH, FILE_NAME);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Archivo no encontrado: ${filePath}`);
            process.exit(1);
        }

        console.log(`📂 Archivo leído: ${FILE_NAME}`);
        const workbook = xlsx.readFile(filePath);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        let validos = 0;
        let omitidos = 0;
        const operations = [];

        data.forEach((row, index) => {
            const rawCedula = row['Cedula'];
            const rawCD = row['CD'];
            const mesNorm = normalizeMes(row['Mes']);

            // QA: Saltar filas sin Cedula, CD o mes no válido
            if (!rawCedula || !rawCD || !mesNorm) {
                omitidos++;
                return;
            }

            const cedula = String(rawCedula).trim();
            const cd = String(rawCD).trim().toUpperCase();
            const mesKey = `${YEAR_IMPORT}-${mesNorm}`;

            operations.push({
                updateOne: {
                    filter: { cedula, cd, mes: mesKey },
                    update: {
                        $set: {
                            cedula, // Guardado explícito según QA
                            cd,     // Guardado explícito según QA
                            mes: mesKey, // Guardado explícito según QA
                            nombre_completo: row['Nombre Completo'] || 'N/A',
                            tml: Number(row['TML']) || 0,
                            tr: Number(row['TR']) || 0,
                            tv: Number(row['TV']) || 0,
                            roturas: Number(row['ROTURAS']) || 0,
                            excesos_jl: Number(row['Excesos de JL']) || 0,
                            supervisor: row['Supervisor'] || 'N/A',
                            personal: row['Personal'] || 'N/A'
                        }
                    },
                    upsert: true
                }
            });
            validos++;
        });

        if (operations.length > 0) {
            const result = await EjecucionKpi.bulkWrite(operations);
            console.log(`-----------------------------------------`);
            console.log(`✅ Proceso finalizado:`);
            console.log(`- Registros válidos: ${validos}`);
            console.log(`- Registros omitidos: ${omitidos}`);
            console.log(`- Insertados/Actualizados: ${result.upsertedCount + result.modifiedCount}`);
            console.log(`-----------------------------------------`);
        } else {
            console.log('⚠️ No se encontraron registros válidos para importar.');
        }

    } catch (error) {
        console.error('❌ Error crítico:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runImport();