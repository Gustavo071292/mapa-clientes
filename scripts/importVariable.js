require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const VariableDiaria = require('../models/VariableDiaria');
const VariableMensual = require('../models/VariableMensual');

const DATA_PATH = path.join(__dirname, '../data');
const YEAR_IMPORT = 2026;

// --- HELPERS DE NORMALIZACIÓN ---

const parseCurrency = (v) => v ? Number(String(v).replace(/[^0-9.-]+/g, "")) || 0 : 0;

const normalizePorcentaje = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    let num = typeof val === 'string' ? parseFloat(val.replace(',', '.').replace('%', '')) : val;
    if (isNaN(num)) return 0;
    // Normaliza: 0.92 -> 92 | 1 -> 100 | 92 -> 92
    return (num > 0 && num <= 1.1) ? num * 100 : num;
};

const normalizeMesEspañol = (val) => {
    if (!val) return null;
    const mesesMap = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return `${YEAR_IMPORT}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const mesLimpio = String(val).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return mesesMap[mesLimpio] ? `${YEAR_IMPORT}-${mesesMap[mesLimpio]}` : null;
};

const parseExcelDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000));
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

// --- PROCESO PRINCIPAL ---

async function runImport() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión a MongoDB establecida.');

        const files = [
            { name: 'Variable diario.xlsx', model: VariableDiaria, type: 'diario' },
            { name: 'Variable mes.xlsx', model: VariableMensual, type: 'mensual' }
        ];

        for (const file of files) {
            const filePath = path.join(DATA_PATH, file.name);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Omitido: ${file.name} no existe en la carpeta data/`);
                continue;
            }

            const workbook = xlsx.readFile(filePath);
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            
            let stats = { leidas: data.length, validas: 0, omitidas: 0 };
            const ops = [];

            data.forEach(row => {
                const id = row['Identificador'] ? String(row['Identificador']).trim() : null;
                if (!id) {
                    stats.omitidas++;
                    return;
                }

                if (file.type === 'diario') {
                    const f = parseExcelDate(row['Fecha']);
                    if (!f) {
                        stats.omitidas++;
                        return;
                    }

                    ops.push({
                        updateOne: {
                            filter: { identificador: id, fecha: f },
                            update: { $set: { 
                                identificador: id,
                                fecha: f,
                                colaborador: row['Colaborador'] || 'N/A',
                                cargo: row['Cargo'] || 'N/A',
                                grupo: String(row['Grupo'] || ''),
                                rechazos: Number(row['Rechazos']) || 0,
                                ausencias_injustificadas: Number(row['Ausencias Injustificadas']) || 0,
                                asistencia: row['Asistencia'] === 'SI' || row['Asistencia'] === 1,
                                dias_trabajados: Number(row['Dias Trabajados']) || 0,
                                cumplimiento_perc: normalizePorcentaje(row['% cumplimiento']),
                                monto_variable_dia: parseCurrency(row['$ Variable'])
                            }},
                            upsert: true
                        }
                    });
                } else {
                    const m = normalizeMesEspañol(row['Mes']);
                    if (!m) {
                        stats.omitidas++;
                        return;
                    }

                    ops.push({
                        updateOne: {
                            filter: { identificador: id, mes: m },
                            update: { $set: {
                                identificador: id,
                                mes: m,
                                nombre_completo: 
                                row['Nombre completo'] ||
                                row['Nombre'] ||
                                `${row['Nombre'] || ''} ${row['Apellido'] || ''}`.trim() ||
                                'N/A',
                                cargo: row['Cargo'] || 'N/A',
                                cd: row['CD'] || 'N/A',
                                pago_variable_dt: parseCurrency(row['Pago variable DT']),
                                salario_variable: parseCurrency(row['Salario variable']),
                                porcentaje_variable: normalizePorcentaje(row['Variable']),
                                dias_trabajados_total: Number(row['Días trabajados']) || 0,
                                ausencia_justificada: Number(row['Ausencia justificada']) || 0,
                                ausencia_injustificada: Number(row['Ausencia injustificada']) || 0
                            }},
                            upsert: true
                        }
                    });
                }
                stats.validas++;
            });

            if (ops.length > 0) {
                const res = await file.model.bulkWrite(ops);
                console.log(`\n📊 Reporte de importación: ${file.name}`);
                console.log(`-------------------------------------------`);
                console.log(`- Filas leídas:     ${stats.leidas}`);
                console.log(`- Filas válidas:    ${stats.validas}`);
                console.log(`- Filas omitidas:   ${stats.omitidas}`);
                console.log(`- Registros nuevos: ${res.upsertedCount}`);
                console.log(`- Actualizados:     ${res.modifiedCount}`);
                console.log(`-------------------------------------------`);
            } else {
                console.warn(`⚠️ No se generaron operaciones válidas para ${file.name}.`);
            }
        }
    } catch (error) {
        console.error('❌ Error crítico durante la importación:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🏁 Proceso finalizado. Conexión cerrada.');
    }
}

runImport();