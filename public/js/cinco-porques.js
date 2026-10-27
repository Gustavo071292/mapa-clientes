/**
 * SISTEMA INTEGRAL DPO - GERENCIA VALLE
 * Módulo Frontend: Entrevista Operacional Guiada 5 Porqués (Mobile-First)
 * Versión 6.0 - Correcciones finales de QA arquitectónico (preguntaActiva, sin innerHTML, sin duplicados)
 */

const basePlacas = {
    "Cali": ["JRK753", "JRK999", "KYO757", "LJT872", "GES495", "TRK554", "GUQ877", "XMC383", "VCL947", "VCL955", "VCM060", "VCM063", "VCM065", "VCM618", "VEJ903", "VCN578", "VEL154", "VCN303", "LJT865", "LUM913", "LGU445", "LGU464", "LGU363", "LGU384", "LGU459", "LGU474", "LGU490", "LGU493", "GUQ635", "GUQ641", "WNZ760", "PRY821", "PRY822", "PSX042", "LJV480", "LJV481", "LJV485", "LJV489", "LJV502", "PSX361", "PSX360", "PSX362", "PSX363", "PSX364", "PSX365", "PSX366", "PSX367", "PSX400", "QJX386", "QJX387", "QJX388", "QJX546", "QJX646", "QJX710", "QJX773", "QJX767", "QJX769", "QJX774", "QJX775", "QJX777", "QJX776", "QJX772", "QJX771", "QJX768", "QJX790", "QJX798", "PSX920", "PSX921", "PSX949", "PSX990", "PSY081", "LJV504", "LJV486", "TRK547", "GUQ895", "VCM009", "VCM613", "VCN097", "VCN302", "VEL941", "VEL502", "LJU893", "LJU892", "LJV505", "LGU481", "LGU468", "TRJ369", "TRK563", "TRK605", "GUQ893", "GUQ896", "GUQ886", "GUQ887", "GUQ889", "UYX698", "XMC384", "VCL948", "VCM007", "VCM036", "VCM257", "VCM260", "VCM619", "VCM855", "VCM068"],
    "Tulua": ["JTS031", "GUQ876", "LJV483", "KSP183", "KSP877", "KSP879", "LCM443", "LCM592", "LCM594", "LCM599", "KSP878", "PSX035"],
    "Popayan": ["KYO756", "LCM445", "LCM561", "LCM565", "LCM588", "JTZ358", "LJV500", "LCN239", "LCN243", "LCM444", "LCM447", "LCM575", "LCM597", "JTY683", "JTY685", "JTY666", "PSX001", "EYX469", "LUM914", "LJT869"],
    "Yumbo": ["VEN066", "GES491", "PSY066", "VCM003", "VCN099", "VCM006", "VEM387", "VCM058", "VCM323", "VCM620", "VEM351", "VEN039", "VEN996", "VEK782", "PSX919", "QJX422", "XMC387", "VEL591", "TRJ367", "KSP887", "KSP883", "LCM598", "GES490", "GES489", "LGU470", "LJW785", "LGU443", "LGU461", "LGU371", "LGU455", "LJT876", "QJX709"]
};

// Estado de la Entrevista Guiada (UNA SOLA DECLARACIÓN DE tomSelectPlaca)
let nivelActual = 1;
let respuestasAcumuladas = [];
let causaRaizConfirmada = null;
let preguntaActiva = "¿Por qué ocurrió la novedad?";
let preguntaSiguienteIA = null;
let pasoConsolidado = false;
let tomSelectPlaca;

function actualizarPlacas() {
    const cd = document.getElementById('cd').value;
    if (!tomSelectPlaca) return;

    tomSelectPlaca.clear();
    tomSelectPlaca.clearOptions();

    if (cd && basePlacas[cd]) {
        basePlacas[cd].forEach(p => {
            tomSelectPlaca.addOption({ value: p, text: p });
        });
    }
    tomSelectPlaca.refreshOptions(false);
}

function verificarOtroIndicador() {
    const s = document.getElementById('indicador');
    const c = document.getElementById('campo_otro_indicador');
    if (c) c.style.display = (s.value === 'Otro') ? 'block' : 'none';
}

function mostrarMensajeInline(texto, tipo = "info") {
    const box = document.getElementById('inline-msg-box');
    if (!box) return;
    box.style.display = 'block';
    box.className = `inline-msg ${tipo}`;
    box.textContent = texto;
}

function ocultarMensajeInline() {
    const box = document.getElementById('inline-msg-box');
    if (box) box.style.display = 'none';
}

function actualizarPreguntaActivaUI() {
    const labelPregunta = document.getElementById('etiqueta-pregunta-activa');
    if (labelPregunta) {
        labelPregunta.textContent = `Pregunta de análisis: ${preguntaActiva}`;
    }
}

function renderizarHistorial() {
    const container = document.getElementById('historial-preguntas-container');
    const lista = document.getElementById('lista-historial-pasos');
    if (!respuestasAcumuladas.length) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';
    lista.replaceChildren(); // Cero innerHTML
    
    respuestasAcumuladas.forEach((resp, idx) => {
        const div = document.createElement('div');
        div.className = 'historial-item';
        
        const strong = document.createElement('strong');
        strong.textContent = `Paso ${idx + 1}: `;
        
        const span = document.createElement('span');
        span.textContent = resp;
        
        div.appendChild(strong);
        div.appendChild(span);
        lista.appendChild(div);
    });
}

function validarIndicadorEspecial() {
    const indicadorVal = document.getElementById('indicador').value;
    if (indicadorVal === 'Otro') {
        const otroTexto = document.getElementById('otro_indicador_texto').value.trim();
        if (!otroTexto) {
            mostrarMensajeInline("Por favor especifique el nombre del otro indicador.", "warning");
            document.getElementById('otro_indicador_texto').focus();
            return null;
        }
        return otroTexto;
    }
    return indicadorVal;
}

async function ejecutarAnalisisIA() {
    ocultarMensajeInline();
    const novedadBase = document.getElementById('novedad_principal').value.trim();
    const cd = document.getElementById('cd').value;
    const indicadorVal = document.getElementById('indicador').value;
    const respuestaInput = document.getElementById('respuesta_actual_input');
    const respuestaActual = respuestaInput.value.trim();

    if (!novedadBase || !cd || !indicadorVal) {
        mostrarMensajeInline("Por favor complete la Descripción de Novedad, el CD y el Indicador antes de analizar.", "warning");
        document.getElementById('novedad_principal').focus();
        return;
    }

    const indicadorFinal = validarIndicadorEspecial();
    if (!indicadorFinal) return;

    if (!respuestaActual) {
        mostrarMensajeInline("Por favor escriba una respuesta antes de solicitar el análisis de IA.", "warning");
        respuestaInput.focus();
        return;
    }

    const btnAnalizar = document.getElementById('btn-analizar-ia');
    const badgeEstado = document.getElementById('badge-estado-ia');
    const evalBox = document.getElementById('ia-evaluacion-box');
    const opcionesContainer = document.getElementById('ia-opciones-container');
    const listaOpciones = document.getElementById('lista-opciones-ia');
    const cardPosibleCausa = document.getElementById('card-posible-causa');
    const btnSiguiente = document.getElementById('btn-siguiente-nivel');

    // Concurrencia UI: Analizando...
    btnAnalizar.disabled = true;
    btnAnalizar.textContent = "Analizando con IA...";
    badgeEstado.style.display = 'inline-block';
    badgeEstado.className = "badge-estado badge-warning";
    badgeEstado.textContent = "Procesando...";

    const transporte = document.getElementById('transporte').value.trim() || null;
    const placa = document.getElementById('placa').value.trim() || null;

    const payload = {
        cd: cd,
        indicador: indicadorFinal,
        descripcion_novedad: novedadBase,
        nivel: nivelActual,
        respuesta_actual: respuestaActual,
        transporte: transporte,
        placa: placa,
        respuestas_anteriores: [...respuestasAcumuladas]
    };

    try {
        const response = await fetch('/api/retro/ia-analizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data = null;
        try {
            data = await response.json();
        } catch (jsonErr) {
            data = null;
        }

        if (data && data.ia_disponible === false) {
            badgeEstado.className = "badge-estado badge-danger";
            badgeEstado.textContent = "IA Indisponible";
            evalBox.style.display = 'block';
            evalBox.textContent = data.mensaje || "El asistente de IA se encuentra temporalmente indisponible. El análisis puede continuar de forma manual.";
            
            btnAnalizar.disabled = false;
            btnAnalizar.textContent = "✨ Analizar con IA";
            btnSiguiente.style.display = 'inline-block';
            return;
        }

        if (!response.ok || !data) {
            throw new Error(`Error en el servidor (${response.status})`);
        }

        evalBox.style.display = 'block';
        evalBox.textContent = data.evaluacion;

        // Capturar propuesta de Canario exclusivamente para el próximo ciclo
        preguntaSiguienteIA = data.pregunta_siguiente ? data.pregunta_siguiente : null;

        // Renderizar opciones (Cero innerHTML, uso estricto de replaceChildren)
        listaOpciones.replaceChildren();
        if (data.opciones && data.opciones.length > 0) {
            opcionesContainer.style.display = 'block';
            
            data.opciones.forEach(opc => {
                const div = document.createElement('div');
                div.className = 'sugerencia-item';
                
                const spanTexto = document.createElement('span');
                spanTexto.textContent = opc;
                
                const btnUsar = document.createElement('button');
                btnUsar.type = 'button';
                btnUsar.className = 'btn-ia';
                btnUsar.style.padding = '4px 8px';
                btnUsar.style.fontSize = '0.8em';
                btnUsar.textContent = 'Usar como referencia';
                btnUsar.onclick = () => {
                    respuestaInput.value = opc;
                    respuestaInput.focus();
                    mostrarMensajeInline("Línea de investigación copiada como borrador. Edítela antes de continuar.", "info");
                };

                div.appendChild(spanTexto);
                div.appendChild(btnUsar);
                listaOpciones.appendChild(div);
            });
        } else {
            opcionesContainer.style.display = 'none';
        }

        switch (data.estado) {
            case 'respuesta_demasiado_general':
                badgeEstado.className = "badge-estado badge-warning";
                badgeEstado.textContent = "Demasiado General";
                mostrarMensajeInline("La respuesta es muy general. Utilice la evaluación como orientación para precisar el motivo antes de continuar.", "warning");
                btnAnalizar.disabled = false;
                btnAnalizar.textContent = "✨ Analizar con IA";
                break;

            case 'requiere_aclaracion':
                badgeEstado.className = "badge-estado badge-warning";
                badgeEstado.textContent = "Requiere Aclaración";
                mostrarMensajeInline("La respuesta presenta ambigüedades. Por favor aclare la información antes de avanzar.", "warning");
                btnAnalizar.disabled = false;
                btnAnalizar.textContent = "✨ Analizar con IA";
                break;

            case 'necesita_profundizar':
                badgeEstado.className = "badge-estado badge-info";
                badgeEstado.textContent = "Necesita Profundizar";
                btnAnalizar.disabled = false;
                btnAnalizar.textContent = "✨ Analizar con IA";
                btnSiguiente.style.display = 'inline-block';
                break;

            case 'respuesta_suficientemente_causal':
                badgeEstado.className = "badge-estado badge-success";
                badgeEstado.textContent = "Relación Causal Útil";
                btnAnalizar.disabled = false;
                btnAnalizar.textContent = "✨ Analizar con IA";
                btnSiguiente.style.display = 'inline-block';
                break;

            case 'posible_causa_raiz':
                badgeEstado.className = "badge-estado badge-success";
                badgeEstado.textContent = "Posible Causa Raíz";
                cardPosibleCausa.style.display = 'block';
                document.getElementById('texto-candidata-raiz').textContent = respuestaActual;
                btnAnalizar.style.display = 'none';
                break;

            default:
                badgeEstado.className = "badge-estado badge-info";
                badgeEstado.textContent = "Evaluado";
                btnAnalizar.disabled = false;
                btnAnalizar.textContent = "✨ Analizar con IA";
                btnSiguiente.style.display = 'inline-block';
                break;
        }

    } catch (err) {
        console.error("Error al conectar con /api/retro/ia-analizar:", err);
        badgeEstado.className = "badge-estado badge-danger";
        badgeEstado.textContent = "Error de Conexión";
        evalBox.style.display = 'block';
        evalBox.textContent = "Error de red al consultar el asistente de IA. Puede continuar manualmente.";
        
        btnAnalizar.disabled = false;
        btnAnalizar.textContent = "✨ Analizar con IA";
        btnSiguiente.style.display = 'inline-block';
    }
}

function avanzarSiguienteNivel() {
    ocultarMensajeInline();
    const respuestaInput = document.getElementById('respuesta_actual_input');
    const valorActual = respuestaInput.value.trim();

    if (!valorActual) {
        mostrarMensajeInline("Por favor ingrese o confirme una respuesta antes de continuar.", "warning");
        respuestaInput.focus();
        return;
    }

    if (pasoConsolidado) {
        return; // Prevención estricta de doble clic / duplicación
    }

    if (respuestasAcumuladas.length >= 5 || nivelActual >= 5) {
        mostrarMensajeInline("Se ha alcanzado el límite temporal de 5 pasos. Por favor revise el análisis y proceda a confirmar la causa raíz manualmente.", "warning");
        return;
    }

    pasoConsolidado = true;

    // Consolidar respuesta en el historial de forma única
    respuestasAcumuladas.push(valorActual);
    renderizarHistorial();

    nivelActual++;

    // Promover la pregunta siguiente generada por la IA como la nueva pregunta activa de este ciclo
    if (preguntaSiguienteIA) {
        preguntaActiva = preguntaSiguienteIA;
    } else {
        preguntaActiva = "¿Por qué ocurrió lo anterior?";
    }
    preguntaSiguienteIA = null; // Limpiar para el próximo ciclo

    actualizarPreguntaActivaUI();
    
    // Limpiar input y controles para el nuevo nivel
    respuestaInput.value = '';
    document.getElementById('ia-evaluacion-box').style.display = 'none';
    document.getElementById('ia-opciones-container').style.display = 'none';
    document.getElementById('badge-estado-ia').style.display = 'none';
    document.getElementById('btn-siguiente-nivel').style.display = 'none';
    
    const btnAnalizar = document.getElementById('btn-analizar-ia');
    btnAnalizar.style.display = 'inline-block';
    btnAnalizar.disabled = false;
    btnAnalizar.textContent = "✨ Analizar con IA";

    pasoConsolidado = false; // Resetear estado de consolidación para permitir la interacción en este nuevo paso
    respuestaInput.focus();
}

function seguirInvestigandoDesdeCausaRaiz() {
    document.getElementById('card-posible-causa').style.display = 'none';
    if (respuestasAcumuladas.length >= 5 || nivelActual >= 5) {
        mostrarMensajeInline("Se ha alcanzado el límite temporal de 5 pasos. Por favor confirme la causa raíz o concluya el análisis.", "warning");
        return;
    }
    if (!preguntaSiguienteIA) {
        preguntaSiguienteIA = "¿Deseas profundizar en qué originó esta posible causa?";
    }
    avanzarSiguienteNivel();
}

function confirmarCausaRaiz() {
    ocultarMensajeInline();
    const respuestaInput = document.getElementById('respuesta_actual_input');
    const valorCandidato = respuestaInput.value.trim();

    if (!valorCandidato) {
        mostrarMensajeInline("No se ha detectado una respuesta válida para confirmar como causa raíz.", "warning");
        return;
    }

    if (pasoConsolidado) {
        return; // Prevención estricta de doble clic / duplicación
    }

    if (respuestasAcumuladas.length >= 5) {
        // Si ya hay 5 elementos, reemplazamos el último o consolidamos sin exceder el tope de 5
        respuestasAcumuladas[respuestasAcumuladas.length - 1] = valorCandidato;
    } else {
        respuestasAcumuladas.push(valorCandidato);
    }
    
    pasoConsolidado = true;
    renderizarHistorial();

    causaRaizConfirmada = valorCandidato;

    document.getElementById('pregunta-activa-box').style.display = 'none';

    const seccionPlan = document.getElementById('seccion-plan-accion');
    seccionPlan.style.opacity = '1';
    seccionPlan.style.pointerEvents = 'auto';

    document.getElementById('display-causa-confirmada').textContent = causaRaizConfirmada;

    const btnGuardar = document.getElementById('btn-guardar-atlas');
    btnGuardar.disabled = false;
    btnGuardar.style.background = 'var(--bavaria-red)';
    btnGuardar.style.cursor = 'pointer';

    seccionPlan.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Envío hacia el backend existente /api/retro/guardar-5porques
const form = document.getElementById('formCincoPorques');
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        ocultarMensajeInline();

        if (!causaRaizConfirmada) {
            mostrarMensajeInline("Debe confirmar una Causa Raíz antes de guardar el análisis en la base de datos.", "error");
            return;
        }

        const cd = document.getElementById('cd').value;
        const indicadorFinal = validarIndicadorEspecial();
        if (!indicadorFinal) return;

        const transporte = document.getElementById('transporte').value.trim() || null;
        const placa = document.getElementById('placa').value.trim() || null;

        const payloadGuardar = {
            cd: cd,
            transporte: transporte,
            placa: placa,
            indicador: indicadorFinal,
            descripcion_novedad: document.getElementById('novedad_principal').value.trim(),
            p1: respuestasAcumuladas[0] || "",
            p2: respuestasAcumuladas[1] || "",
            p3: respuestasAcumuladas[2] || "",
            p4: respuestasAcumuladas[3] || "",
            p5: respuestasAcumuladas[4] || "",
            causa_raiz: causaRaizConfirmada,
            plan_accion: document.getElementById('plan_accion').value.trim(),
            responsable: document.getElementById('responsable').value.trim(),
            fecha_compromiso: document.getElementById('fecha_compromiso').value
        };

        const btnGuardar = document.getElementById('btn-guardar-atlas');
        btnGuardar.disabled = true;

        try {
            const res = await fetch('/api/retro/guardar-5porques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadGuardar)
            });

            let r = null;
            try {
                r = await res.json();
            } catch (jsonErr) {
                r = null;
            }

            if (res.ok && r && r.exito) {
                mostrarMensajeInline("✅ Análisis guardado exitosamente en MongoDB Atlas. Recargando...", "success");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                btnGuardar.disabled = false;
                mostrarMensajeInline("Error al guardar: " + (r && r.mensaje ? r.mensaje : "Respuesta inesperada del servidor"), "error");
            }
        } catch (err) {
            console.error("Error de conexión al guardar:", err);
            btnGuardar.disabled = false;
            mostrarMensajeInline("Error de red al intentar guardar en Atlas. Verifique su conexión.", "error");
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {
    tomSelectPlaca = new TomSelect("#placa", {
        create: false,
        sortField: { field: "text", direction: "asc" },
        placeholder: "Buscar placa...",
        maxOptions: 1000
    });

    actualizarPlacas();
    actualizarPreguntaActivaUI();
});