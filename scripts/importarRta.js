/**
 * SISTEMA INTEGRAL DPO - GERENCIA VALLE
 * SCRIPT DE IMPORTACIÓN MASIVA: RTA
 */

const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Rta = require('../models/Rta');

function limpiarTexto(valor) {
    if (valor === undefined || valor === null) return "";
    return String(valor).trim();
}

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

function normalizarSiNo(valor, defecto = "No") {
    const v = limpiarTexto(valor);
    if (["Si", "No"].includes(v)) return v;
    if (["SI", "SÍ", "si", "sí"].includes(v)) return "Si";
    if (["NO", "no"].includes(v)) return "No";
    return defecto;
}

function normalizarResultado(valor) {
    const v = limpiarTexto(valor);
    if (["OK", "NO_OK", ""].includes(v)) return v;
    if (v.toUpperCase() === "NO OK") return "NO_OK";
    return "";
}

function normalizarEstado(valor) {
    const estados = ["Pendiente", "En Proceso", "Realizado", "Cerrado"];
    const v = limpiarTexto(valor);
    return estados.includes(v) ? v : "Pendiente";
}

function normalizarPrioridad(valor) {
    const prioridades = ["Alta", "Media", "Baja"];
    const v = limpiarTexto(valor);
    return prioridades.includes(v) ? v : "Media";
}

function crearLlave(doc) {
    const fecha = doc.fechaHallazgo instanceof Date
        ? doc.fechaHallazgo.toISOString().split('T')[0]
        : "0000-00-00";

    const cd = limpiarTexto(doc.cd).toUpperCase();
    const equipo = limpiarTexto(doc.equipo).toUpperCase();
    const kpi = limpiarTexto(doc.kpi).toUpperCase();
    const desc = limpiarTexto(doc.descripcionAnomalia).toLowerCase();

    return `${fecha}|${cd}|${equipo}|${kpi}|${desc}`;
}

function construirComentarios(fila) {
    const comentarios = [];

    for (let i = 0; i <= 5; i++) {
        const texto = limpiarTexto(fila[`comentarios[${i}].texto`]);
        const estadoNuevo = limpiarTexto(fila[`comentarios[${i}].estadoNuevo`]);
        const estadoAnterior = limpiarTexto(fila[`comentarios[${i}].estadoAnterior`]);
        const fecha = normalizarFechaISO(fila[`comentarios[${i}].fecha`]);

        if (texto && estadoNuevo) {
            comentarios.push({
                texto,
                estadoAnterior,
                estadoNuevo,
                fecha: fecha || new Date()
            });
        }
    }

    return comentarios;
}

async function importarRta() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Conectado a MongoDB Atlas ---');

        const filePath = path.join(__dirname, '../data/mapa_clientes.rta.xlsx');

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Error: No se encontró el archivo en ${filePath}`);
            process.exit(1);
        }

        const workbook = xlsx.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
            defval: "",
            raw: true
        });

        console.log(`\n[1/4] Leídos ${data.length} registros del archivo Excel.`);

        console.log('[2/4] Sincronizando llaves históricas de Atlas...');
        const existentes = await Rta.find({}, {
            fechaHallazgo: 1,
            cd: 1,
            equipo: 1,
            kpi: 1,
            descripcionAnomalia: 1,
            _id: 0
        }).lean();

        const setExistentes = new Set();
        existentes.forEach(doc => {
            setExistentes.add(crearLlave(doc));
        });

        console.log(`[Info] Memoria lista con ${setExistentes.size} registros existentes.`);

        const registrosParaInsertar = [];
        const llavesEnExcel = new Set();

        let dupMongo = 0;
        let dupExcel = 0;
        let errores = 0;

        console.log('[3/4] Validando integridad, fechas y campos obligatorios...');

        for (const fila of data) {
            delete fila._id;
            delete fila.__v;

            const fechaHallazgo = normalizarFechaISO(fila.fechaHallazgo);
            const cuandoDetecto = normalizarFechaISO(fila.cuandoDetecto);
            const fechaCierre1 = normalizarFechaISO(fila.fechaCierre1);
            const fechaCierre2 = normalizarFechaISO(fila.fechaCierre2);
            const fechaCierre3 = normalizarFechaISO(fila.fechaCierre3);
            const fechaGestion = normalizarFechaISO(fila.fechaGestion);
            const fechaCreacion = normalizarFechaISO(fila.fecha_creacion);

            const doc = {
                fechaHallazgo,
                ejecutor: limpiarTexto(fila.ejecutor),
                negocio: limpiarTexto(fila.negocio),
                cd: limpiarTexto(fila.cd),
                equipo: limpiarTexto(fila.equipo),
                tipoAnomalia: limpiarTexto(fila.tipoAnomalia),
                tipoEvento: limpiarTexto(fila.tipoEvento),
                kpi: limpiarTexto(fila.kpi),

                descripcionAnomalia: limpiarTexto(fila.descripcionAnomalia),
                descripcionProblema: limpiarTexto(fila.descripcionProblema),
                queDetecto: limpiarTexto(fila.queDetecto),
                cuandoDetecto,
                dondeDetecto: limpiarTexto(fila.dondeDetecto),
                quienDetecto: limpiarTexto(fila.quienDetecto),
                quienIntervino: limpiarTexto(fila.quienIntervino),

                punto1: limpiarTexto(fila.punto1),
                resultado1: normalizarResultado(fila.resultado1),
                accion1: limpiarTexto(fila.accion1),

                punto2: limpiarTexto(fila.punto2),
                resultado2: normalizarResultado(fila.resultado2),
                accion2: limpiarTexto(fila.accion2),

                punto3: limpiarTexto(fila.punto3),
                resultado3: normalizarResultado(fila.resultado3),
                accion3: limpiarTexto(fila.accion3),

                sopDisponible: normalizarSiNo(fila.sopDisponible),
                sopAplicable: normalizarSiNo(fila.sopAplicable),
                sopRevisar: normalizarSiNo(fila.sopRevisar),
                sopCapacitacion: normalizarSiNo(fila.sopCapacitacion),
                sopImplementado: normalizarSiNo(fila.sopImplementado),
                reincidencia: normalizarSiNo(fila.reincidencia),

                porQue1: limpiarTexto(fila.porQue1),
                porQue2: limpiarTexto(fila.porQue2),
                porQue3: limpiarTexto(fila.porQue3),
                porQue4: limpiarTexto(fila.porQue4),
                porQue5: limpiarTexto(fila.porQue5),
                causaRaiz: limpiarTexto(fila.causaRaiz),

                planAccion1: limpiarTexto(fila.planAccion1),
                responsable1: limpiarTexto(fila.responsable1),
                fechaCierre1,

                planAccion2: limpiarTexto(fila.planAccion2),
                responsable2: limpiarTexto(fila.responsable2),
                fechaCierre2: fechaCierre2 || undefined,

                planAccion3: limpiarTexto(fila.planAccion3),
                responsable3: limpiarTexto(fila.responsable3),
                fechaCierre3: fechaCierre3 || undefined,

                estado: normalizarEstado(fila.estado),
                prioridad: normalizarPrioridad(fila.prioridad),
                comentarioGestion: limpiarTexto(fila.comentarioGestion),
                fechaGestion: fechaGestion || undefined,

                comentarios: construirComentarios(fila),

                sugerenciasIA: [],
                origenAnalisisIA: fila.origenAnalisisIA === true || limpiarTexto(fila.origenAnalisisIA).toLowerCase() === "true",

                fecha_creacion: fechaCreacion || new Date()
            };

            if (
                !doc.fechaHallazgo ||
                !doc.ejecutor ||
                !doc.negocio ||
                !doc.cd ||
                !doc.equipo ||
                !doc.tipoAnomalia ||
                !doc.tipoEvento ||
                !doc.kpi ||
                !doc.descripcionAnomalia ||
                !doc.descripcionProblema ||
                !doc.queDetecto ||
                !doc.cuandoDetecto ||
                !doc.dondeDetecto ||
                !doc.quienDetecto ||
                !doc.causaRaiz ||
                !doc.planAccion1 ||
                !doc.responsable1 ||
                !doc.fechaCierre1
            ) {
                errores++;
                continue;
            }

            const llave = crearLlave(doc);

            if (llavesEnExcel.has(llave)) {
                dupExcel++;
                continue;
            }

            if (setExistentes.has(llave)) {
                dupMongo++;
                continue;
            }

            llavesEnExcel.add(llave);
            registrosParaInsertar.push(doc);
        }

        let insertados = 0;

        if (registrosParaInsertar.length > 0) {
            console.log(`[4/4] Insertando ${registrosParaInsertar.length} registros nuevos...`);
            const resultado = await Rta.insertMany(registrosParaInsertar, {
                ordered: false
            });
            insertados = resultado.length;
        } else {
            console.log('[4/4] No hay registros nuevos para insertar.');
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

importarRta();