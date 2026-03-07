// Variables globales para el estado del Dashboard
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
 * 2. RENDERIZAR TODO: Orquestador de filtros y visualizaciones
 */
function renderizarTodo() {
    const cd = document.getElementById('filtroCD').value;
    const tipo = document.getElementById('filtroTipo').value;
    const estado = document.getElementById('filtroEstado').value;
    const fechaFiltro = document.getElementById('filtroFecha').value; // Captura YYYY-MM-DD
    
    // APLICACIÓN DE FILTROS CRUZADOS (Incluye la nueva lógica de fecha exacta)
    let filtrados = dataGlobal.filter(d => {
        const cumpleCD = (cd === 'TODOS' || d.cd === cd);
        const cumpleTipo = (tipo === 'TODOS' || d.tipoDoc === tipo);
        const cumpleEstado = (estado === 'TODOS' || d.estado === estado);
        
        let cumpleFecha = true;
        if (fechaFiltro && d.fecha) {
            // Normalizamos la fecha de Atlas a YYYY-MM-DD para comparar con el input
            const fechaItem = new Date(d.fecha).toISOString().split('T')[0];
            cumpleFecha = (fechaItem === fechaFiltro);
        }

        return cumpleCD && cumpleTipo && cumpleEstado && cumpleFecha;
    });

    // Actualización de KPIs Superiores
    document.getElementById('totalNovedades').innerText = filtrados.filter(d => d.tipoDoc === 'Novedad').length;
    document.getElementById('totalPorques').innerText = filtrados.filter(d => d.tipoDoc === '5 Porqués').length;
    document.getElementById('totalPendientes').innerText = filtrados.filter(d => d.estado === 'Pendiente').length;

    // Actualización de Visualizaciones
    actualizarGraficoEfectividad(filtrados);
    actualizarGraficoPorCD(filtrados); 
    actualizarGraficoPlacas(filtrados);
    actualizarTablaAuditoria(filtrados);
}

/**
 * 3. GRÁFICO DE BARRAS POR CD (Tendencia por CD)
 */
function actualizarGraficoPorCD(items) {
    const cds = ['Cali', 'Popayan', 'Tulua', 'Yumbo'];
    const conteo = { 'Cali': 0, 'Popayan': 0, 'Tulua': 0, 'Yumbo': 0 };

    items.forEach(i => {
        if (conteo.hasOwnProperty(i.cd)) conteo[i.cd]++;
    });

    const ctx = document.getElementById('chartPorCD').getContext('2d');
    if (myBarChartCD) myBarChartCD.destroy();

    myBarChartCD = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cds,
            datasets: [{
                label: 'Reportes por CD',
                data: cds.map(c => conteo[c]),
                backgroundColor: ['#c8102e', '#f2c200', '#30363d', '#8b949e'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
                x: { ticks: { color: '#f0f6fc' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * 4. GRÁFICO DE DONA: Nivel de Gestión General
 */
function actualizarGraficoEfectividad(items) {
    const realizados = items.filter(d => d.estado === 'Realizado').length;
    const pendientes = items.filter(d => d.estado === 'Pendiente').length;
    const total = items.length;
    const porcentaje = total > 0 ? Math.round((realizados / total) * 100) : 0;

    const ctx = document.getElementById('chartEfectividad').getContext('2d');
    if (myDoughnutChart) myDoughnutChart.destroy();

    myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gestionado', 'Pendiente'],
            datasets: [{
                data: [realizados, pendientes],
                backgroundColor: ['#238636', '#c8102e'],
                borderWidth: 0
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
 * 5. GRÁFICO DE BARRAS: Top 5 Placas Críticas (Horizontal)
 */
function actualizarGraficoPlacas(items) {
    const conteo = {};
    items.forEach(i => {
        const p = i.placa || "S/P";
        conteo[p] = (conteo[p] || 0) + 1;
    });
    
    const sortedPlacas = Object.entries(conteo)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const ctx = document.getElementById('chartTopPlacas').getContext('2d');
    if (myBarChartPlacas) myBarChartPlacas.destroy();
    
    myBarChartPlacas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedPlacas.map(p => p[0]),
            datasets: [{
                label: 'Incidentes',
                data: sortedPlacas.map(p => p[1]),
                backgroundColor: '#d29922' 
            }]
        },
        options: {
            indexAxis: 'y', 
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
                y: { ticks: { color: '#f0f6fc' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * 6. TABLA DE AUDITORÍA Y GESTIÓN
 */
function actualizarTablaAuditoria(items) {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');
        // Usamos toLocaleDateString para que la fecha sea legible (DD/MM/AAAA)
        const fecha = new Date(item.fecha).toLocaleDateString('es-ES');
        const estado = item.estado || 'Pendiente';
        
        tr.innerHTML = `
            <td>${item.icono || '📋'} ${item.tipoDoc}</td>
            <td>${item.cd}</td>
            <td><strong>${item.placa}</strong></td>
            <td>${fecha}</td>
            <td><span class="badge ${estado.toLowerCase().replace(/\s+/g, '-')}">${estado}</span></td>
            <td><button class="btn-gestionar" onclick="abrirModalGestion('${item._id}', '${item.tipoDoc}')">⚙️ Gestionar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalGestion(id, tipoDoc) {
    const reporte = dataGlobal.find(item => item._id === id);
    reporteSeleccionado = { id, tipoDoc };
    if (reporte) {
        document.getElementById('detalleTextoOriginal').innerText = reporte.descripcion || "Sin detalle";
    }
    document.getElementById('infoReporte').innerText = `Gestionando: ${tipoDoc}`;
    document.getElementById('modalGestion').style.display = 'block';
}

async function guardarGestion() {
    const comentario = document.getElementById('comentarioGestion').value;
    const nuevoEstado = document.getElementById('nuevoEstado').value;

    if (!comentario) return alert("⚠️ Debes ingresar un comentario de gestión.");

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
            cargarDataDashboard(); 
        }
    } catch (error) {
        console.error("Error al guardar gestión:", error);
    }
}

function cerrarModal() {
    document.getElementById('modalGestion').style.display = 'none';
    document.getElementById('comentarioGestion').value = '';
}

// Inicialización automática al cargar la ventana
window.onload = cargarDataDashboard;