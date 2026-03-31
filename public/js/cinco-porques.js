/**
 * SISTEMA INTEGRAL DPO - GERENCIA VALLE
 */

const basePlacas = {
    "Cali": ["JRK753", "JRK999", "KYO757", "LJT872", "GES495", "TRK554", "GUQ877", "XMC383", "VCL947", "VCL955", "VCM060", "VCM063", "VCM065", "VCM618", "VEJ903", "VCN578", "VEL154", "VCN303", "LJT865", "LUM913", "LGU445", "LGU464", "LGU363", "LGU384", "LGU459", "LGU474", "LGU490", "LGU493", "GUQ635", "GUQ641", "WNZ760", "PRY821", "PRY822", "PSX042", "LJV480", "LJV481", "LJV485", "LJV489", "LJV502", "PSX361", "PSX360", "PSX362", "PSX363", "PSX364", "PSX365", "PSX366", "PSX367", "PSX400", "QJX386", "QJX387", "QJX388", "QJX546", "QJX646", "QJX710", "QJX773", "QJX767", "QJX769", "QJX774", "QJX775", "QJX777", "QJX776", "QJX772", "QJX771", "QJX768", "QJX790", "QJX798", "PSX920", "PSX921", "PSX949", "PSX990", "PSY081", "LJV504", "LJV486", "TRK547", "GUQ895", "VCM009", "VCM613", "VCN097", "VCN302", "VEL941", "VEL502", "LJU893", "LJU892", "LJV505", "LGU481", "LGU468", "TRJ369", "TRK563", "TRK605", "GUQ893", "GUQ896", "GUQ886", "GUQ887", "GUQ889", "UYX698", "XMC384", "VCL948", "VCM007", "VCM036", "VCM257", "VCM260", "VCM619", "VCM855", "VCM068"],
    "Tulua": ["JTS031", "GUQ876", "LJV483", "KSP183", "KSP877", "KSP879", "LCM443", "LCM592", "LCM594", "LCM599", "KSP878", "PSX035"],
    "Popayan": ["KYO756", "LCM445", "LCM561", "LCM565", "LCM588", "JTZ358", "LJV500", "LCN239", "LCN243", "LCM444", "LCM447", "LCM575", "LCM597", "JTY683", "JTY685", "JTY666", "PSX001", "EYX469", "LUM914", "LJT869"],
    "Yumbo": ["VEN066", "GES491", "PSY066", "VCM003", "VCN099", "VCM006", "VEM387", "VCM058", "VCM323", "VCM620", "VEM351", "VEN039", "VEN996", "VEK782", "PSX919", "QJX422", "XMC387", "VEL591", "TRJ367", "KSP887", "KSP883", "LCM598", "GES490", "GES489", "LGU470", "LJW785", "LGU443", "LGU461", "LGU371", "LGU455", "LJT876", "QJX709"]
};

function actualizarPlacas() {
    const cd = document.getElementById('cd').value;
    const select = document.getElementById('placa');
    select.innerHTML = '<option value="">Seleccione placa...</option>';
    if (cd && basePlacas[cd]) {
        basePlacas[cd].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p; opt.text = p;
            select.appendChild(opt);
        });
    }
}

function verificarOtroIndicador() {
    const s = document.getElementById('indicador');
    const c = document.getElementById('campo_otro_indicador');
    if (c) c.style.display = (s.value === 'Otro') ? 'block' : 'none';
}

function mostrarSiguienteNivel(nivel) {
    const inputActual = document.getElementById(`p${nivel}`);
    if (inputActual && inputActual.value.trim().length > 3) {
        if (nivel < 5) {
            const siguiente = document.getElementById(`nivel-${nivel + 1}`);
            if (siguiente) {
                siguiente.style.display = "block";
                siguiente.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
    const plan = document.getElementById('plan_accion');
    // Quitamos el prefijo "Acción preventiva:" y simplemente pasamos el valor
    if (plan && plan.value === "") plan.value = inputActual.value;
}
    }
}

async function consultarIA(nivel) {
    const novedadBase = document.getElementById('novedad_principal').value;
    const textoAnt = nivel === 1 ? novedadBase : document.getElementById(`p${nivel-1}`).value;
    const resBox = document.getElementById(`ia-res-${nivel}`);
    const kpi = document.getElementById('indicador').value;
    
    if(!textoAnt) return alert("Describe la novedad antes de pedir sugerencias.");

    resBox.style.display = 'block';
    resBox.innerHTML = `<p style="color: #f2c200; font-size: 0.8em;">🤖 Analizando causa raíz para ${kpi}...</p>`;

    try {
        const response = await fetch('/api/retro/ia-sugerencia', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textoEntrada: textoAnt, nivelPorqué: nivel, indicadorSeleccionado: kpi })
        });
        const data = await response.json();
        resBox.innerHTML = `<strong>Sugerencias IA para ${kpi}:</strong>`;
        data.opciones.forEach(opc => {
            const div = document.createElement('div');
            div.className = 'sugerencia-item';
            div.innerText = opc;
            div.onclick = () => { 
                document.getElementById(`p${nivel}`).value = opc; 
                resBox.style.display = 'none';
                mostrarSiguienteNivel(nivel);
            };
            resBox.appendChild(div);
        });
    } catch (err) { resBox.innerHTML = '<p style="color:red;">Error con Gemini</p>'; }
}

const form = document.getElementById('formCincoPorques');
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        const ind = document.getElementById('indicador').value;
        const payload = {
            cd: document.getElementById('cd').value,
            transporte: document.getElementById('transporte').value,
            placa: document.getElementById('placa').value,
            indicador: ind === 'Otro' ? document.getElementById('otro_indicador_texto').value : ind,
            descripcion_novedad: document.getElementById('novedad_principal').value,
            p1: document.getElementById('p1').value, p2: document.getElementById('p2').value,
            p3: document.getElementById('p3').value, p4: document.getElementById('p4').value,
            p5: document.getElementById('p5').value,
            plan_accion: document.getElementById('plan_accion').value,
            responsable: document.getElementById('responsable').value,
            fecha_compromiso: document.getElementById('fecha_compromiso').value
        };

        try {
            const res = await fetch('/api/retro/guardar-5porques', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const r = await res.json();
            if (r.exito) {
                alert("✅ Guardado en Atlas.");
                window.location.reload();
            }
        } catch (e) { alert("Error de conexión."); }
    };
}