const mongoose = require('mongoose');
require('dotenv').config();

const Retro = require('../models/Retro');

async function resetRetrosSeguro() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('--- Conectado a MongoDB Atlas ---\n');

        // Conteo antes de borrar
        const total = await Retro.countDocuments();

        console.log('=======================================');
        console.log('     AUDITORÍA PREVIA DE SEGURIDAD');
        console.log('=======================================');
        console.log(`Colección objetivo: retros`);
        console.log(`Total registros actuales: ${total}`);
        console.log('=======================================\n');

        if (total === 0) {
            console.log('⚠️ La colección ya está vacía.');
            process.exit();
        }

        // Eliminación controlada
        console.log('[1/2] Eliminando registros históricos...\n');

        const resultado = await Retro.deleteMany({});

        console.log(`✅ Registros eliminados: ${resultado.deletedCount}\n`);

        // Validación posterior
        const restante = await Retro.countDocuments();

        console.log('[2/2] Validando integridad final...\n');

        console.log(`Registros restantes en Atlas: ${restante}`);

        if (restante === 0) {
            console.log('\n✅ Colección retros limpiada correctamente.');
        } else {
            console.log('\n⚠️ Aún existen registros en la colección.');
        }

    } catch (error) {
        console.error('\n❌ Error crítico:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nConexión cerrada.');
        process.exit();
    }
}

resetRetrosSeguro();