const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

const Retro = require('../models/Retro');

/**
 * CORRECCIÓN QA: Convierte entradas (Serial Excel, Date, String) 
 * al formato estándar YYYY-MM-DD.
 */
function normalizarFecha(valor) {
    if (!valor) return '0000-00-00';
    
    let fecha;

    // Caso 1: Serial de Excel (Número)
    if (typeof valor === 'number') {
        // xlsx.utils.format_cell con el código interno de fecha o SSF
        // Pero la forma más segura para Date objects es:
        fecha = new Date(Math.round((valor - 25569) * 86400 * 1000));
    } 
    // Caso 2: Ya es un objeto Date
    else if (valor instanceof Date) {
        fecha = valor;
    } 
    // Caso 3: Es un string (ej. "2026-05-12" o "12/05/2026")
    else {
        fecha = new Date(valor);
    }

    // Validar si la fecha resultante es válida
    if (!fecha || isNaN(fecha.getTime())) {
        return '0000-00-00';
    }

    // Usamos métodos UTC para evitar desfases por zona horaria de la máquina local
    const year = fecha.getUTCFullYear();
    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fecha.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Crea una llave única estandarizada para evitar duplicados.
 */
function crearLlave(fechaReporte, placa, comentarios) {
    const f = normalizarFecha(fechaReporte);
    const p = String(placa || '').trim().toUpperCase();
    const c = String(comentarios || '').trim().toLowerCase();
    return `${f}|${p}|${c}`;
}

async function importarDatos() {
    try {
        // Conexión a MongoDB Atlas
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Conectado a MongoDB Atlas ---');

        const filePath = path.join(__dirname, '../data/mapa_clientes.retros.xlsx');
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`\n[1/4] Leídos ${data.length} registros del archivo Excel.`);

        // 3. Cargar llaves existentes de MongoDB (Acelerado con Set)
        console.log('[2/4] Sincronizando llaves históricas de Atlas...');
        const existentes = await Retro.find({}, { fechaReporte: 1, placa: 1, comentarios: 1, _id: 0 }).lean();
        
        const setExistentes = new Set();
        existentes.forEach(doc => {
            setExistentes.add(crearLlave(doc.fechaReporte, doc.placa, doc.comentarios));
        });
        
        console.log(`[Info] Memoria lista con ${setExistentes.size} registros existentes.`);

        const registrosParaInsertar = [];
        const llavesEnArchivoExcel = new Set();
        
        let dupMongo = 0;
        let dupExcel = 0;
        let errores = 0;

        const tiposPermitidos = [
            'Pre ruta', 'En ruta', 'Post ruta', 
            'PDV o Ruta Critica', 'Reporte de roturas', 
            'Checklist T2', 'Reportes ACIS'
        ];

        // 4. Procesamiento
        console.log('[3/4] Validando integridad y normalizando llaves...');
        for (const fila of data) {
            delete fila._id;
            delete fila.__v;

            // Validación de campos obligatorios según Schema
            if (!fila.fechaReporte || !fila.cedula || !fila.cd || !fila.placa || !fila.codigoCliente || !fila.tipoRetro) {
                errores++;
                continue;
            }

            if (!tiposPermitidos.includes(fila.tipoRetro)) {
                errores++;
                continue;
            }

            // Generamos la llave normalizada tras corrección de fecha
            const llaveUnica = crearLlave(fila.fechaReporte, fila.placa, fila.comentarios);

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

        // 5. Inserción Masiva
        let insertados = 0;
        if (registrosParaInsertar.length > 0) {
            console.log(`[4/4] Insertando ${registrosParaInsertar.length} registros nuevos...`);
            const resultado = await Retro.insertMany(registrosParaInsertar, { ordered: false });
            insertados = resultado.length;
        }

        // 6. Resumen de Auditoría
        console.log('\n=======================================');
        console.log('      RESUMEN FINAL DE AUDITORÍA');
        console.log('=======================================');
        console.log(`Total registros Excel:   ${data.length}`);
        console.log(`Válidos para Atlas:      ${registrosParaInsertar.length}`);
        console.log(`---------------------------------------`);
        console.log(`Insertados con éxito:    ${insertados}`);
        console.log(`Duplicados en Atlas:     ${dupMongo}`);
        console.log(`Duplicados en Excel:     ${dupExcel}`);
        console.log(`Errores (Campos/Enum):   ${errores}`);
        console.log('=======================================\n');

    } catch (error) {
        console.error('\n[Error Crítico]:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
        process.exit();
    }
}

importarDatos();