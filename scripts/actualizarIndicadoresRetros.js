const mongoose = require('mongoose');
require('dotenv').config();

const Retro = require('../models/Retro');

const INDICADORES_VALIDOS = [
    'DQI (Roturas)',
    'ACIS UC',
    'Rechazos',
    'Cashless',
    '5´s',
    'Adherencia a Km',
    'Adherencia a Tiempo',
    'TRI',
    'PNP',
    'Modulación',
    'TML',
    'Otro',
    'TI (Tiempo interno)',
    'OTIF',
    'RMD',
    'TR (Tiempo en ruta)'
];

const CAMBIOS_PERMITIDOS = [
    { de: 'LTI', a: 'TI (Tiempo interno)' },
    { de: 'Modulacion', a: 'Modulación' },
    { de: 'TR', a: 'TR (Tiempo en ruta)' }
];

async function listarIndicadores(titulo) {
    console.log(`\n${titulo}`);
    console.log('---------------------------------------');

    const indicadores = await Retro.aggregate([
        {
            $group: {
                _id: '$indicador',
                total: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } }
    ]);

    indicadores.forEach(item => {
        console.log(`${item._id || 'SIN INDICADOR'}: ${item.total}`);
    });

    return indicadores;
}

async function actualizarIndicadoresRetros() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Conectado a MongoDB Atlas ---');

        await listarIndicadores('[1/3] Indicadores actuales antes de corregir');

        console.log('\n[2/3] Aplicando correcciones controladas...');
        console.log('---------------------------------------');

        for (const cambio of CAMBIOS_PERMITIDOS) {
            const encontrados = await Retro.countDocuments({ indicador: cambio.de });

            if (encontrados === 0) {
                console.log(`${cambio.de} → ${cambio.a}: 0 encontrados`);
                continue;
            }

            const resultado = await Retro.updateMany(
                { indicador: cambio.de },
                { $set: { indicador: cambio.a } }
            );

            console.log(`${cambio.de} → ${cambio.a}: ${resultado.modifiedCount} actualizados`);
        }

        const indicadoresFinales = await listarIndicadores('[3/3] Indicadores después de corregir');

        console.log('\nVALIDACIÓN FINAL');
        console.log('---------------------------------------');

        const invalidos = indicadoresFinales.filter(item => {
            const indicador = item._id || '';
            return !INDICADORES_VALIDOS.includes(indicador);
        });

        if (invalidos.length === 0) {
            console.log('✅ Todos los indicadores quedan dentro de la lista válida.');
        } else {
            console.log('⚠️ Indicadores aún no válidos encontrados:');
            invalidos.forEach(item => {
                console.log(`- ${item._id || 'SIN INDICADOR'}: ${item.total}`);
            });
        }

        console.log('\n✅ Proceso finalizado.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
        process.exit();
    }
}

actualizarIndicadoresRetros();