/**
 * SISTEMA INTEGRAL DPO - GERENCIA VALLE
 * SCRIPT DE IMPORTACIÓN MASIVA: Análisis 5 Porqués
 */

const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const CincoPorques = require('../models/CincoPorques');

function normalizarFechaISO(valor) {
    if (valor === undefined || valor === null || valor === '') return null;

    let fecha;

    if (typeof valor === 'number') {
        fecha = new Date(Math.round((valor - 25569) * 86400 * 1000));
    } else if (valor instanceof Date) {
        fecha = valor;
    } else {
        fecha = new Date(valor);
    }

    if (!fecha || isNaN(fecha.getTime())) return null;
    if (fecha.getFullYear() < 2020) return null;

    return fecha;
}

function crearLlave(fecha_creacion, placa, indicador, descripcion_novedad) {
    const f = fecha_creacion instanceof Date
        ? fecha_creacion.toISOString().split('T')[0]
        : '0000-00-00';

    const p = String(placa || '').trim().toUpperCase();
    const i = String(indicador || '').trim().toUpperCase();
    const d = String(descripcion_novedad || '').trim().toLowerCase();

    return `${f}|${p}|${i}|${d}`;
}

async function importarCincoPorques() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Conectado a MongoDB Atlas ---');

        const filePath = path.join(__dirname, '../data/mapa_clientes.cinco_porques.xlsx');

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Error: No se encontró el archivo en ${filePath}`);
            process.exit(1);
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`\n[1/4] Leídos ${data.length} registros del archivo Excel.`);

        console.log('[2/4] Sincronizando llaves históricas de Atlas...');
        const existentes = await CincoPorques.find({}, {
            fecha_creacion: 1,
            placa: 1,
            indicador: 1,
            descripcion_novedad: 1,
            _id: 0
        }).lean();

        const setExistentes = new Set();

        existentes.forEach(doc => {
            if (doc.fecha_creacion) {
                setExistentes.add(
                    crearLlave(
                        doc.fecha_creacion,
                        doc.placa,
                        doc.indicador,
                        doc.descripcion_novedad
                    )
                );
            }
        });

        console.log(`[Info] Memoria lista con ${setExistentes.size} registros existentes.`);

        const registrosParaInsertar = [];
        const llavesEnArchivoExcel = new Set();

        let dupMongo = 0;
        let dupExcel = 0;
        let errores = 0;

        const estadosPermitidos = ['Pendiente', 'En Proceso', 'Realizado', 'Cerrado'];

        console.log('[3/4] Validando integridad y normalizando fechas...');

        for (const fila of data) {
            delete fila._id;
            delete fila.__v;

            const fCreacion = normalizarFechaISO(fila.fecha_creacion);
            const fCompromiso = normalizarFechaISO(fila.fecha_compromiso);
            const fGestion = normalizarFechaISO(fila.fechaGestion);

            if (
                !fCreacion ||
                !fila.placa ||
                !fila.indicador ||
                !fila.descripcion_novedad
            ) {
                errores++;
                continue;
            }

            fila.fecha_creacion = fCreacion;
            fila.fecha_compromiso = fCompromiso || undefined;
            fila.fechaGestion = fGestion || undefined;

            fila.cd = String(fila.cd || '').trim();
            fila.transporte = String(fila.transporte || '').trim();
            fila.placa = String(fila.placa || '').trim().toUpperCase();
            fila.indicador = String(fila.indicador || '').trim();
            fila.descripcion_novedad = String(fila.descripcion_novedad || '').trim();
            fila.causa_raiz = String(fila.causa_raiz || '').trim();
            fila.plan_accion = String(fila.plan_accion || '').trim();
            fila.responsable = String(fila.responsable || '').trim();

            if (!fila.estado || !estadosPermitidos.includes(fila.estado)) {
                fila.estado = 'Pendiente';
            }

            const llaveUnica = crearLlave(
                fila.fecha_creacion,
                fila.placa,
                fila.indicador,
                fila.descripcion_novedad
            );

            if (llavesEnArchivoExcel.has(llaveUnica)) {
                dupExcel++;
                continue;
            }

            if (setExistentes.has(llaveUnica)) {
                dupMongo++;
                continue;
            }

            llavesEnArchivoExcel.add(llaveUnica);
            registrosParaInsertar.push(fila);
        }

        let insertados = 0;

        if (registrosParaInsertar.length > 0) {
            console.log(`[4/4] Insertando ${registrosParaInsertar.length} registros nuevos...`);
            const resultado = await CincoPorques.insertMany(registrosParaInsertar, {
                ordered: false
            });
            insertados = resultado.length;
        }

        console.log('\n=======================================');
        console.log('      RESUMEN FINAL DE AUDITORÍA');
        console.log('=======================================');
        console.log(`Total registros Excel:   ${data.length}`);
        console.log(`Válidos para Atlas:      ${registrosParaInsertar.length}`);
        console.log('---------------------------------------');
        console.log(`Insertados con éxito:    ${insertados}`);
        console.log(`Duplicados en Atlas:     ${dupMongo}`);
        console.log(`Duplicados en Excel:     ${dupExcel}`);
        console.log(`Errores (Fechas/Campos): ${errores}`);
        console.log('=======================================\n');

    } catch (error) {
        console.error('\n[Error Crítico]:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
        process.exit();
    }
}

importarCincoPorques();