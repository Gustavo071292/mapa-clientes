// 1. DEFINICIÓN DE DATOS (Mantenemos tu base de datos de placas y roturas)
const basePlacas = {
    "Cali": ["JRK753", "JRK999", "KYO757", "LJT872", "GES495", "TRK554", "GUQ877", "XMC383", "VCL947", "VCL955", "VCM060", "VCM063", "VCM065", "VCM618", "VEJ903", "VCN578", "VEL154", "VCN303", "LJT865", "LUM913", "LGU445", "LGU464", "LGU363", "LGU384", "LGU459", "LGU474", "LGU490", "LGU493", "GUQ635", "GUQ641", "WNZ760", "PRY821", "PRY822", "PSX042", "LJV480", "LJV481", "LJV485", "LJV489", "LJV502", "PSX361", "PSX360", "PSX362", "PSX363", "PSX364", "PSX365", "PSX366", "PSX367", "PSX400", "QJX386", "QJX387", "QJX388", "QJX546", "QJX646", "QJX710", "QJX773", "QJX767", "QJX769", "QJX774", "QJX775", "QJX777", "QJX776", "QJX772", "QJX771", "QJX768", "QJX790", "QJX798", "PSX920", "PSX921", "PSX949", "PSX990", "PSY081", "LJV504", "LJV486", "TRK547", "GUQ895", "VCM009", "VCM613", "VCN097", "VCN302", "VEL941", "VEL502", "LJU893", "LJU892", "LJV505", "LGU481", "LGU468", "TRJ369", "TRK563", "TRK605", "GUQ893", "GUQ896", "GUQ886", "GUQ887", "GUQ889", "UYX698", "XMC384", "VCL948", "VCM007", "VCM036", "VCM257", "VCM260", "VCM619", "VCM855", "VCM068"],
    "Tulua": ["JTS031", "GUQ876", "LJV483", "KSP183", "KSP877", "KSP879", "LCM443", "LCM592", "LCM594", "LCM599", "KSP878", "PSX035"],
    "Popayan": ["KYO756", "LCM445", "LCM561", "LCM565", "LCM588", "JTZ358", "LJV500", "LCN239", "LCN243", "LCM444", "LCM447", "LCM575", "LCM597", "JTY683", "JTY685", "JTY666", "PSX001", "EYX469", "LUM914", "LJT869"],
    "Yumbo": ["VEN066", "GES491", "PSY066", "VCM003", "VCN099", "VCM006", "VEM387", "VCM058", "VCM323", "VCM620", "VEM351", "VEN039", "VEN996", "VEK782", "PSX919", "QJX422", "XMC387", "VEL591", "TRJ367", "KSP887", "KSP883", "LCM598", "GES490", "GES489", "LGU470", "LJW785", "LGU443", "LGU461", "LGU371", "LGU455", "LJT876", "QJX709"]
};

const referenciasRoturas = {
    "Maltas": ["Pony Malta Pet 1.0L X 15", "Pony Malta Pet 1.5LX 6", "Pony Malta Pet 200cc X 6", "Pony Malta Pet 200ccX30", "Pony Malta Pet 330cc X 24", "Pony Malta R 330cc X 30"],
    "Agua": ["AGUA ZALVA SIN GAS PET 1.5 L X 6", "AGUA ZALVA SIN GAS PET 1.5 L X 6 PCR", "Agua Zalva Sin Gas Pet 600 X 12", "Agua Zalva Sin Gas Pet 600cc X 24"],
    "Cervezas": ["AGUILA LIGHT CAN 330CC X6 THERMO INK", "COSTEÑA RB 330CC X30", "POKER LTA 330CC X6 LOOSE PACK LN9", "Aguila Lta 473cc X 6", "Aguila Lig Lta 330ccX6", "Poker Lta 330cc X 6", "Poker R 330cc X 30", "Poker R 750cc X 16"],
    "MKP": ["Aguardiente Caucano tradicional 750ml", "Blanco del Valle Aguardiente SA 375 ml", "Blanco del Valle Aguardiente Fiesta 375"]
};

// 2. FUNCIONES DE INTERFAZ
function actualizarPlacas() {
    const cd = document.getElementById('cd').value;
    const selectPlaca = document.getElementById('placa');
    selectPlaca.innerHTML = '<option value="">Seleccione placa...</option>';
    if (cd && basePlacas[cd]) {
        basePlacas[cd].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p; opt.text = p;
            selectPlaca.appendChild(opt);
        });
    }
}

function checkTipoNovedad() {
    const tipo = document.getElementById('tipo_retro').value;
    const seccion = document.getElementById('seccion_roturas');
    if (seccion) seccion.style.display = (tipo === 'Reporte de roturas') ? 'block' : 'none';
}

function filtrarMateriales() {
    const cat = document.getElementById('categoria').value;
    const selectMat = document.getElementById('material');
    if (!selectMat) return;
    selectMat.innerHTML = '<option value="">Seleccione material...</option>';
    if (cat && referenciasRoturas[cat]) {
        referenciasRoturas[cat].forEach(ref => {
            const opt = document.createElement('option');
            opt.value = ref; opt.text = ref;
            selectMat.appendChild(opt);
        });
        const optOtro = document.createElement('option');
        optOtro.value = "Otro"; optOtro.text = "Otro";
        selectMat.appendChild(optOtro);
    }
}

function contarCaracteres() {
    const text = document.getElementById('observacion').value;
    const count = document.getElementById('charCount');
    if (count) count.innerText = `${text.length} / 255 caracteres`;
}

// 3. ENVÍO DE DATOS
document.getElementById('formNovedades').onsubmit = async (e) => {
    e.preventDefault();
    
    // Bloqueamos el botón para evitar doble envío
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "⏳ Guardando...";

    const tipoRetro = document.getElementById('tipo_retro').value;
    
    const payload = {
        fecha: document.getElementById('fecha').value,
        cedula: document.getElementById('cedula').value,
        cd: document.getElementById('cd').value,
        placa: document.getElementById('placa').value,
        codigo_cliente: document.getElementById('codigo_cliente').value,
        indicador: document.getElementById('indicador').value,
        tipo_retroalimentacion: tipoRetro,
        observacion: document.getElementById('observacion').value,
        categoria: tipoRetro === 'Reporte de roturas' ? document.getElementById('categoria').value : null,
        material: tipoRetro === 'Reporte de roturas' ? document.getElementById('material').value : null,
        unidades: tipoRetro === 'Reporte de roturas' ? parseInt(document.getElementById('unidades').value) || 0 : 0
    };

    try {
        const response = await fetch('/api/retro/guardar-novedad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.exito) {
            alert("✅ Reporte guardado con éxito en Atlas.");
            window.location.reload();
        } else {
            alert("❌ Error al guardar: " + result.mensaje);
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (error) {
        console.error("Error envío:", error);
        alert("❌ Error crítico de conexión con el servidor.");
        btn.disabled = false;
        btn.innerText = originalText;
    }
};