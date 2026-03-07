/**
 * SISTEMA INTEGRAL DPO - GERENCIA VALLE
 * Lógica del Dashboard Ejecutivo de Control
 */

// Variables globales para el estado y manejo de gráficos
let dataGlobal = [];
let myDoughnutChart = null;
let myBarChartPlacas = null;
let myBarChartCD = null; 
let reporteSeleccionado = null;

/**
 * 1. CARGA INICIAL: Obtiene la data unificada del Backend (Atlas)
 */
async function cargarDataDashboard() {
    try {
        const response = await fetch('/api/retro/consolidado-valle');
        const result = await response.json();
        
        if (result.exito) {
            dataGlobal = result.data;
            renderizarTodo(); 
        } else {
            console.error("Error del servidor:", result.mensaje);
        }
    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        alert("❌ Error de comunicación: No se pudo conectar con el Servidor DPO.");
    }
}

/**
 * 2. ORQUESTADOR DE RENDERIZADO
 * Filtra la data y actualiza todos los componentes visuales
 */
function renderizarTodo() {
    // Captura de valores de filtros
    const cd = document.getElementById('filtroCD')?.value || 'TODOS';
    const tipo = document.getElementById('filtroTipo')?.value || 'TODOS';
    const estado = document.getElementById('filtroEstado')?.value || 'TODOS';
    const fechaFiltro = document.getElementById('filtroFecha')?.value; 
    
    // Aplicación de lógica de filtrado cruzado
    let filtrados = dataGlobal.filter(d => {
        const cumpleCD = (cd === 'TODOS' || d.cd === cd);
        const cumpleTipo = (tipo === 'TODOS' || d.tipoDoc === tipo);
        const cumpleEstado = (estado === 'TODOS' || d.estado === estado);
        
        let cumpleFecha = true;
        if (fechaFiltro && d.fecha) {
            // Normalización a YYYY-MM-DD para comparación precisa
            const fechaItem = new Date(d.fecha).toISOString().split('T')[0];
            cumpleFecha = (fechaItem === fechaFiltro);
        }

        return cumpleCD && cumpleTipo && cumpleEstado && cumpleFecha;
    });

    // Actualización dinámica de KPIs superiores
    actualizarKPIs(filtrados);

    // Actualización de componentes visuales (Gráficos y Tabla)
    actualizarGraficoEfectividad(filtrados);
    actualizarGraficoPorCD(filtrados); 
    actualizarGraficoPlacas(filtrados);
    actualizarTablaAuditoria(filtrados);
}

/**
 * 3. ACTUALIZACIÓN DE INDICADORES (KPIs)
 */
function actualizarKPIs(filtrados) {
    const ids = {
        'totalNovedades': 'Novedad',
        'totalPorques': '5 Porqués',
        'totalPendientes': 'Pendiente' // En este caso filtramos por campo estado
    };

    Object.keys(ids).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'totalPendientes') {
                element.innerText = filtrados.filter(d => d.estado === 'Pendiente').length;
            } else {
                element.innerText = filtrados.filter(d => d.tipoDoc === ids[id]).length;
            }
        }
    });
}

/**
 * 4. GRÁFICO TENDENCIA POR CD (Barras Verticales)
 */
function actualizarGraficoPorCD(items) {
    const cds = ['Cali', 'Popayan', 'Tulua', 'Yumbo'];
    const conteo = { 'Cali': 0, 'Popayan': 0, 'Tulua': 0, 'Yumbo': 0 };

    items.forEach(i => {
        if (conteo.hasOwnProperty(i.cd)) conteo[i.cd]++;
    });

    const canvas = document.getElementById('chartPorCD');
    if (!canvas) return;
    
    if (myBarChartCD) myBarChartCD.destroy();

    myBarChartCD = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: cds,
            datasets: [{
                label: 'Reportes',
                data: cds.map(c => conteo[c]),
                backgroundColor: ['#c8102e', '#f2c200', '#30363d', '#8b949e'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#30363d' }, ticks: { color: '#8b949e', stepSize: 1 } },
                x: { ticks: { color: '#f0f6fc' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * 5. GRÁFICO NIVEL DE GESTIÓN (Dona / Gauge)
 */
function actualizarGraficoEfectividad(items) {
    const realizados = items.filter(d => d.estado === 'Realizado').length;
    const pendientes = items.filter(d => d.estado === 'Pendiente').length;
    const total = items.length;
    const porcentaje = total > 0 ? Math.round((realizados / total) * 100) : 0;

    const canvas = document.getElementById('chartEfectividad');
    if (!canvas) return;

    if (myDoughnutChart) myDoughnutChart.destroy();

    myDoughnutChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Gestionado', 'Pendiente'],
            datasets: [{
                data: [realizados, pendientes],
                backgroundColor: ['#238636', '#c8102e'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false } }
        },
        plugins: [{
            id: 'textCenter',
            beforeDraw: (chart) => {
                const { width, height, ctx } = chart;
                ctx.restore();
                ctx.font = "bold 2.5em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#f0f6fc";
                const text = porcentaje + "%",
                      textX = Math.round((width - ctx.measureText(text).width) / 2),
                      textY = height / 2;
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

/**
 * 6. GRÁFICO TOP 5 PLACAS (Barras Horizontales)
 */
function actualizarGraficoPlacas(items) {
    const conteo = {};
    items.forEach(i => {
        const p = i.placa || "S/P";
        conteo[p] = (conteo[p] || 0) + 1;
    });
    
    const sorted = Object.entries(conteo)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const canvas = document.getElementById('chartTopPlacas');
    if (!canvas) return;

    if (myBarChartPlacas) myBarChartPlacas.destroy();
    
    myBarChartPlacas = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: sorted.map(p => p[0]),
            datasets: [{
                label: 'Eventos',
                data: sorted.map(p => p[1]),
                backgroundColor: '#d29922' 
            }]
        },
        options: {
            indexAxis: 'y', 
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { beginAtZero: true, grid: { color: '#30363d' }, ticks: { color: '#8b949e', stepSize: 1 } },
                y: { ticks: { color: '#f0f6fc' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * 7. TABLA DE AUDITORÍA Y CONTROL
 */
function actualizarTablaAuditoria(items) {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ordenamos por fecha descendente (más recientes primero)
    const ordenados = [...items].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    ordenados.forEach(item => {
        const tr = document.createElement('tr');
        const fechaStr = new Date(item.fecha).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const estado = item.estado || 'Pendiente';
        const badgeClass = estado.toLowerCase().replace(/\s+/g, '-');
        
        tr.innerHTML = `
            <td>${item.icono || '📋'} ${item.tipoDoc}</td>
            <td>${item.cd}</td>
            <td><strong style="color: #f2c200;">${item.placa}</strong></td>
            <td>${fechaStr}</td>
            <td><span class="badge ${badgeClass}">${estado}</span></td>
            <td>
                <button class="btn-gestionar" onclick="abrirModalGestion('${item._id}', '${item.tipoDoc}')">
                    ⚙️ Gestionar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 8. GESTIÓN DE MODAL Y GUARDADO
 */
function abrirModalGestion(id, tipoDoc) {
    const reporte = dataGlobal.find(item => item._id === id);
    reporteSeleccionado = { id, tipoDoc };
    
    if (reporte) {
        document.getElementById('detalleTextoOriginal').innerText = reporte.descripcion || "Sin descripción disponible.";
        document.getElementById('infoReporte').innerText = `Gestión de Evidencia: ${tipoDoc}`;
        document.getElementById('modalGestion').style.display = 'block';
    }
}

async function guardarGestion() {
    const comentario = document.getElementById('comentarioGestion')?.value;
    const nuevoEstado = document.getElementById('nuevoEstado')?.value;

    if (!comentario || comentario.trim().length < 5) {
        return alert("⚠️ Por favor, ingresa un comentario de gestión detallado.");
    }

    try {
        const response = await fetch('/api/retro/gestionar-reporte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: reporteSeleccionado.id,
                tipoDoc: reporteSeleccionado.tipoDoc,
                nuevoEstado: nuevoEstado,
                comentario: comentario
            })
        });

        const result = await response.json();
        if (result.exito) {
            cerrarModal();
            // Recarga solo la data de Atlas para refrescar el tablero
            await cargarDataDashboard(); 
        } else {
            alert("Error al guardar: " + result.mensaje);
        }
    } catch (error) {
        console.error("Error en el guardado:", error);
    }
}

function cerrarModal() {
    document.getElementById('modalGestion').style.display = 'none';
    const textarea = document.getElementById('comentarioGestion');
    if (textarea) textarea.value = '';
}

/**
 * 9. INICIALIZACIÓN Y EVENT LISTENERS
 */
window.onload = () => {
    // Carga inicial
    cargarDataDashboard();

    // Integración de filtros reactivos (actualizan el dashboard al cambiar)
    const filtros = ['filtroCD', 'filtroTipo', 'filtroEstado', 'filtroFecha'];
    filtros.forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderizarTodo);
    });
};