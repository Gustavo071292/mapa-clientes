// 1. DEFINICIÓN DE DATOS (Mantenemos tu lista completa de la Gerencia Valle)
const basePlacas = {
    "Cali": [
        "JRK753", "JRK999", "KYO757", "LJT872", "GES495", "TRK554", "GUQ877", "XMC383", 
        "VCL947", "VCL955", "VCM060", "VCM063", "VCM065", "VCM618", "VEJ903", "VCN578", 
        "VEL154", "VCN303", "LJT865", "LUM913", "LGU445", "LGU464", "LGU363", "LGU384", 
        "LGU459", "LGU474", "LGU490", "LGU493", "GUQ635", "GUQ641", "WNZ760", "PRY821", 
        "PRY822", "PSX042", "LJV480", "LJV481", "LJV485", "LJV489", "LJV502", "PSX361", 
        "PSX360", "PSX362", "PSX363", "PSX364", "PSX365", "PSX366", "PSX367", "PSX400", 
        "QJX386", "QJX387", "QJX388", "QJX546", "QJX646", "QJX710", "QJX773", "QJX767", 
        "QJX769", "QJX774", "QJX775", "QJX777", "QJX776", "QJX772", "QJX771", "QJX768", 
        "QJX790", "QJX798", "PSX920", "PSX921", "PSX949", "PSX990", "PSY081", "LJV504", 
        "LJV486", "TRK547", "GUQ895", "VCM009", "VCM613", "VCN097", "VCN302", "VEL941", 
        "VEL502", "LJU893", "LJU892", "LJV505", "LGU481", "LGU468", "TRJ369", "TRK563", 
        "TRK605", "GUQ893", "GUQ896", "GUQ886", "GUQ887", "GUQ889", "UYX698", "XMC384", 
        "VCL948", "VCM007", "VCM036", "VCM257", "VCM260", "VCM619", "VCM855", "VCM068"
    ],
    "Tulua": [
        "JTS031", "GUQ876", "LJV483", "KSP183", "KSP877", "KSP879", "LCM443", "LCM592", 
        "LCM594", "LCM599", "KSP878", "PSX035"
    ],
    "Popayan": [
        "KYO756", "LCM445", "LCM561", "LCM565", "LCM588", "JTZ358", "LJV500", "LCN239", 
        "LCN243", "LCM444", "LCM447", "LCM575", "LCM597", "JTY683", "JTY685", "JTY666", 
        "PSX001", "EYX469", "LUM914", "LJT869"
    ],
    "Yumbo": [
        "VEN066", "GES491", "PSY066", "VCM003", "VCN099", "VCM006", "VEM387", "VCM058", 
        "VCM323", "VCM620", "VEM351", "VEN039", "VEN996", "VEK782", "PSX919", "QJX422", 
        "XMC387", "VEL591", "TRJ367", "KSP887", "KSP883", "LCM598", "GES490", "GES489", 
        "LGU470", "LJW785", "LGU443", "LGU461", "LGU371", "LGU455", "LJT876", "QJX709"
    ]
};

// 2. FUNCIONES LÓGICAS
// Unificamos en una sola función clara
function actualizarPlacas() {
    const cd = document.getElementById('cd').value;
    const selectPlaca = document.getElementById('placa');
    
    // Limpiamos siempre antes de cargar
    selectPlaca.innerHTML = '<option value="">Seleccione placa...</option>';
    
    if (cd && basePlacas[cd]) {
        basePlacas[cd].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p; 
            opt.text = p;
            selectPlaca.appendChild(opt);
        });
    }
}

function contarCaracteres() {
    const text = document.getElementById('observacion').value;
    // Asegúrate de que el ID charCount exista en tu HTML
    const charCountLabel = document.getElementById('charCount');
    if (charCountLabel) {
        charCountLabel.innerText = `${text.length} / 255 caracteres`;
    }
}

// 3. ENVÍO DE FORMULARIO
document.getElementById('formNovedades').onsubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
        fecha: document.getElementById('fecha').value,
        cedula: document.getElementById('cedula').value,
        cd: document.getElementById('cd').value,
        placa: document.getElementById('placa').value,
        codigo_cliente: document.getElementById('codigo_cliente').value,
        tipo_retroalimentacion: document.getElementById('tipo_retro').value,
        observacion: document.getElementById('observacion').value
    };

    try {
        const response = await fetch('/equipos-empoderados/retro/guardar-novedad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.exito) {
            alert("✅ Novedad guardada correctamente en Atlas.");
            window.location.href = "/equipos-empoderados";
        } else {
            alert("❌ Error al guardar la novedad: " + (result.mensaje || "Error desconocido"));
        }
    } catch (error) {
        console.error("Error en el envío:", error);
        alert("❌ Error crítico de conexión. Verifica que el servidor esté encendido.");
    }
};