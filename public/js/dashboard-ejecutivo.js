/**
 * SISTEMA INTEGRAL DPO - GERENCIA VALLE
 * Dashboard Ejecutivo Unificado - v6.0
 */

let dataGlobal = [];
let charts = {}; 
let reporteSeleccionado = null;

// 1. CARGA DE DATOS DESDE EL BACKEND
async function cargarDataDashboard() {
    try {
        const response = await fetch('/api/retro/consolidado-valle');
        const result = await response.json();
        if (result.exito) {
            dataGlobal = result.data;
            renderizarTodo(); 
        }
    } catch (error) {
        console.error("Error en cargarDataDashboard:", error);
    }
}

// 2. FILTRADO Y RENDERIZADO
function renderizarTodo() {
    const cd = document.getElementById('filtroCD')?.value || 'TODOS';
    const tipo = document.getElementById('filtroTipo')?.value || 'TODOS';
    const tipoRetro = document.getElementById('filtroTipoRetro')?.value || 'TODOS';
    const estado = document.getElementById('filtroEstado')?.value || 'TODOS';
    const fechaFiltro = document.getElementById('filtroFecha')?.value; 
    
    let filtrados = dataGlobal.filter(d => {
        const cumpleCD = (cd === 'TODOS' || d.cd === cd);
        const cumpleTipo = (tipo === 'TODOS' || d.tipo === tipo);
        const cumpleTipoRetro = (tipoRetro === 'TODOS' || d.extra?.tipoRetro === tipoRetro);
        const cumpleEstado = (estado === 'TODOS' || d.estado === estado);
        
        let cumpleFecha = true;
        if (fechaFiltro && d.fecha) {
            const fechaItem = new Date(d.fecha).toISOString().split('T')[0];
            cumpleFecha = (fechaItem === fechaFiltro);
        }
        return cumpleCD && cumpleTipo && cumpleEstado && cumpleFecha && cumpleTipoRetro;
    });

    actualizarKPIs(filtrados);
    actualizarTablaAuditoria(filtrados);
    
    if (window.innerWidth > 768) {
        dibujarGrafica('chartPorCD', 'bar', generarDataCD(filtrados));
        dibujarGrafica('chartTopPlacas', 'bar', generarDataPlacas(filtrados), { indexAxis: 'y' });
        dibujarGrafica('chartIndicadores', 'bar', generarDataPareto(filtrados));
        dibujarGrafica('chartMensual', 'line', generarDataMensual(filtrados), { 
            plugins: { 
                legend: { 
                    display: true, 
                    labels: { color: '#f0f6fc', font: { size: 12 } } 
                } 
            } 
        });
    } 
}

function generarDataMensual(items) {
    const mesesNombre = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const cds = ["Cali", "Popayan", "Tulua", "Yumbo"];
    const colores = { 'Cali': '#c8102e', 'Popayan': '#d29922', 'Tulua': '#3fb950', 'Yumbo': '#3498db' };
    const mesesSet = new Set();
    items.forEach(i => {
        const d = new Date(i.fecha);
        mesesSet.add(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    });
    const mesesOrdenados = Array.from(mesesSet).sort();
    const datasets = cds.map(cd => {
        const dataPorMes = mesesOrdenados.map(mesAnio => {
            return items.filter(i => {
                const d = new Date(i.fecha);
                const itemMesAnio = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                return i.cd === cd && itemMesAnio === mesAnio;
            }).length;
        });
        return {
            label: cd, data: dataPorMes, borderColor: colores[cd], backgroundColor: 'transparent',
            tension: 0.4, borderWidth: 3, pointRadius: 5, pointHoverRadius: 8
        };
    });
    return {
        labels: mesesOrdenados.map(m => {
            const [anio, mes] = m.split('-');
            return `${mesesNombre[parseInt(mes) - 1]} ${anio}`;
        }),
        datasets: datasets.filter(ds => ds.data.some(val => val > 0))
    };
}

function generarDataPlacas(items) {
    const conteo = {};
    items.forEach(i => { 
        const id = i.identificador; 
        if (id && id !== "S/N" && id !== "SIN PLACA") {
            conteo[id] = (conteo[id] || 0) + 1; 
        }
    });
    const sorted = Object.entries(conteo).sort(([,a], [,b]) => b - a).slice(0, 5);
    return {
        labels: sorted.map(p => p[0]),
        datasets: [{ data: sorted.map(p => p[1]), backgroundColor: '#d29922' }]
    };
}

function generarDataPareto(items) {
    const conteo = {};
    items.forEach(i => {
        if (i.descripcion && i.descripcion.includes(':')) {
            const nombre = i.descripcion.split(':')[0].trim();
            if (nombre !== 'General' || Object.keys(conteo).length === 0) {
                conteo[nombre] = (conteo[nombre] || 0) + 1;
            }
        }
    });
    const sorted = Object.entries(conteo).sort(([,a], [,b]) => b - a);
    return {
        labels: sorted.map(p => p[0]),
        datasets: [{ label: 'Incidentes', data: sorted.map(p => p[1]), backgroundColor: '#3fb950', borderRadius: 5 }]
    };
}

function dibujarGrafica(canvasId, type, data, extraOptions = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, {
        type: type, data: data,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#30363d' }, ticks: { color: '#8b949e', stepSize: 1 } },
                x: { ticks: { color: '#f0f6fc' } }
            },
            plugins: { legend: { display: false } }, ...extraOptions
        }
    });
}

// REFACTORIZACIÓN DE MODAL (REGLA 8)
function abrirModalGestion(id, tipo) {
    const reporte = dataGlobal.find(item => item._id === id);
    if (!reporte) return;

    reporteSeleccionado = { id, tipo };

    // Inyectar Datos básicos
    document.getElementById('modalIdBadge').innerText = `#${id.slice(-6).toUpperCase()}`;
    document.getElementById('detFecha').innerText = new Date(reporte.fecha).toLocaleDateString();
    document.getElementById('detCD').innerText = reporte.cd;
    document.getElementById('detIndicador').innerText = reporte.extra?.indicador || "General";
    document.getElementById('detPlaca').innerText = reporte.identificador;
    document.getElementById('detalleTextoOriginal').innerText = reporte.descripcion || "Sin descripción.";
    
    // Validación de Estado (Regla QA)
    const estadoActual = reporte.estado || "Pendiente";
    const badge = document.getElementById('detEstadoBadge');
    
    badge.innerText = estadoActual;
    badge.className = `badge-status status-${estadoActual.toLowerCase().replace(/\s+/g, '-')}`;

    // Limpieza de campos y pre-selección de estado
    document.getElementById('comentarioGestion').value = "";
    document.getElementById('nuevoEstado').value = estadoActual;
    document.getElementById('modalFeedback').style.display = 'none';

    // Cargar Historial
    renderizarHistorial(reporte.extra?.historial || []);

    document.getElementById('modalGestion').style.display = 'block';
}

function renderizarHistorial(historial) {
    const contenedor = document.getElementById('contenedorHistorial');
    if (!historial || historial.length === 0) {
        contenedor.innerHTML = '<div class="empty-hist">Sin comentarios de gestión registrados.</div>';
        return;
    }

    contenedor.innerHTML = historial.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(g => `
        <div class="historial-item">
            <div class="hist-meta">
                <span class="hist-date">${new Date(g.fecha).toLocaleString()}</span>
                <span class="hist-flow">${g.estadoAnterior || '---'} ➜ ${g.estadoNuevo}</span>
            </div>
            <p class="hist-text">${g.comentario}</p>
            <small class="hist-user">👤 ${g.usuarioGestion || 'Gestor'}</small>
        </div>
    `).join('');
}

async function guardarGestion() {
    const comentario = document.getElementById('comentarioGestion').value;
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    const btn = document.getElementById('btnGuardarGestion');
    
    if (!comentario || comentario.trim().length < 5) {
        mostrarFeedback('error', "⚠️ Por favor, escribe un comentario de gestión (mín. 5 caracteres).");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "⏳ Guardando...";

        const response = await fetch('/api/retro/gestionar-reporte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: reporteSeleccionado.id, 
                tipoDoc: reporteSeleccionado.tipo, 
                nuevoEstado: nuevoEstado, 
                comentario: comentario 
            })
        });

        const result = await response.json();
        if (result.exito) {
            mostrarFeedback('success', "✅ Gestión guardada con éxito.");
            setTimeout(() => {
                cerrarModal();
                cargarDataDashboard(); // Mantener carga total (Regla 10)
            }, 1500);
        } else {
            mostrarFeedback('error', "❌ Error: " + result.mensaje);
            btn.disabled = false;
            btn.innerText = "💾 Guardar Cambios";
        }
    } catch (e) {
        mostrarFeedback('error', "❌ Error de comunicación con el servidor.");
        btn.disabled = false;
        btn.innerText = "💾 Guardar Cambios";
    }
}

function mostrarFeedback(tipo, texto) {
    const fb = document.getElementById('modalFeedback');
    fb.innerText = texto;
    fb.className = `modal-feedback-box fb-${tipo}`;
    fb.style.display = 'block';
}

function cerrarModal() { 
    document.getElementById('modalGestion').style.display = 'none';
}

function actualizarKPIs(filtrados) {
    document.getElementById('totalNovedades').innerText = filtrados.filter(d => d.tipo !== '5 Porqués').length;
    document.getElementById('totalPorques').innerText = filtrados.filter(d => d.tipo === '5 Porqués').length;
    document.getElementById('totalPendientes').innerText = filtrados.filter(d => d.estado === 'Pendiente').length;
}

function actualizarTablaAuditoria(items) {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;
    tbody.innerHTML = items.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(item => {
        const claseEstado = item.estado.toLowerCase().replace(/\s+/g, '-');
        return `
        <tr>
            <td>${item.extra?.fuente === 'Análisis' ? '🧠' : '🚚'} ${item.tipo}</td>
            <td>${item.cd}</td>
            <td><strong>${item.identificador}</strong></td> 
            <td>${new Date(item.fecha).toLocaleDateString()}</td>
            <td><span class="badge ${claseEstado}">${item.estado}</span></td>
            <td><button class="btn-gestionar" onclick="abrirModalGestion('${item._id}', '${item.tipo}')">⚙️</button></td>
        </tr>
    `}).join('');
}

function exportarAExcel() {
    const cd = document.getElementById('filtroCD').value;
    const filtrados = dataGlobal.filter(d => cd === 'TODOS' || d.cd === cd);
    const dataParaExcel = filtrados.map(d => ({
        Fecha: new Date(d.fecha).toLocaleDateString(), CD: d.cd, Tipo: d.tipo, Indicador: d.extra?.indicador || "S/N",
        Placa: d.identificador, Estado: d.estado, Detalle: d.descripcion, Responsable: d.extra?.responsable || "S/N"
    }));
    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte DPO");
    XLSX.writeFile(wb, `DPO_Valle_${new Date().getTime()}.xlsx`);
}

function generarDataCD(items) {
    const conteo = { Cali:0, Popayan:0, Tulua:0, Yumbo:0 };
    items.forEach(i => { if(conteo.hasOwnProperty(i.cd)) conteo[i.cd]++; });
    return { labels: Object.keys(conteo), datasets: [{ data: Object.values(conteo), backgroundColor: '#c8102e' }] };
}

window.onload = () => {
    cargarDataDashboard();
    ['filtroCD', 'filtroTipo', 'filtroEstado', 'filtroFecha', 'filtroTipoRetro'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderizarTodo);
    });
};