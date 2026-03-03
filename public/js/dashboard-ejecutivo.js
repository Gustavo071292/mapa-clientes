// Variables globales para el estado del Dashboard
let dataGlobal = [];
let myDoughnutChart = null;
let myBarChart = null;
let reporteSeleccionado = null;

/**
 * 1. CARGA INICIAL: Obtiene la data unificada del Backend
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
    const mesFiltro = document.getElementById('filtroMes').value; 
    
    let filtrados = dataGlobal;

    if (cd !== 'TODOS') {
        filtrados = filtrados.filter(d => d.cd === cd);
    }

    if (mesFiltro) {
        filtrados = filtrados.filter(d => {
            const fechaBruta = d.fecha;
            if (!fechaBruta) return false; 
            const fechaItem = new Date(fechaBruta);
            const mesItem = `${fechaItem.getFullYear()}-${String(fechaItem.getMonth() + 1).padStart(2, '0')}`;
            return mesItem === mesFiltro;
        });
    }

    // KPIs Superiores
    document.getElementById('totalNovedades').innerText = filtrados.filter(d => d.tipoDoc === 'Novedad').length;
    document.getElementById('totalPorques').innerText = filtrados.filter(d => d.tipoDoc === '5 Porqués').length;
    document.getElementById('totalPendientes').innerText = filtrados.filter(d => d.estado !== 'Realizado').length;

    actualizarGraficoEfectividad(filtrados);
    actualizarGraficoPlacas(filtrados);
    actualizarTablaAuditoria(filtrados);
}

/**
 * 3. GRÁFICO DE DONA: Nivel de Gestión
 */
function actualizarGraficoEfectividad(items) {
    const realizados = items.filter(d => d.estado === 'Realizado').length;
    const pendientes = items.filter(d => d.estado !== 'Realizado').length;
    const total = items.length;
    const porcentaje = total > 0 ? Math.round((realizados / total) * 100) : 0;

    const canvas = document.getElementById('chartEfectividad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myDoughnutChart) myDoughnutChart.destroy();

    myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gestionado', 'Pendiente'],
            datasets: [{
                data: [realizados, pendientes],
                backgroundColor: ['#28a745', '#c8102e'],
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
                ctx.font = "bold 2em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "white";
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
 * 4. GRÁFICO DE BARRAS: Top Placas con más Reportes
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

    const labels = sortedPlacas.map(p => p[0]);
    const valores = sortedPlacas.map(p => p[1]);

    const canvas = document.getElementById('chartTopPlacas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myBarChart) myBarChart.destroy();
    
    myBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Incidentes',
                data: valores,
                backgroundColor: '#c8102e'
            }]
        },
        options: {
            responsive: true,
            scales: { 
                y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: 'white' } },
                x: { ticks: { color: 'white' } }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}

/**
 * 5. TABLA DE AUDITORÍA (CORREGIDA: Usa item.descripcion)
 */
function actualizarTablaAuditoria(items) {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');
        const fecha = new Date(item.fecha).toLocaleDateString();
        const estadoRaw = item.estado || 'Pendiente';
        const estadoClase = estadoRaw.toLowerCase().replace(/\s+/g, '-');
        
        tr.innerHTML = `
            <td>${item.icono || '📋'} ${item.tipoDoc}</td>
            <td>${item.cd}</td>
            <td><strong>${item.placa}</strong></td>
            <td>${fecha}</td>
            <td><span class="badge ${estadoClase}">${estadoRaw}</span></td>
            <td><button class="btn-gestionar" onclick="abrirModalGestion('${item._id}', '${item.tipoDoc}')">⚙️ Gestionar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 6. GESTIÓN DE REPORTES (MODAL CORREGIDO)
 */
function abrirModalGestion(id, tipoDoc) {
    const reporte = dataGlobal.find(item => item._id === id);
    reporteSeleccionado = { id, tipoDoc };

    if (reporte) {
        // CORRECCIÓN: Usamos 'descripcion' que viene unificada desde el controlador
        document.getElementById('detalleTextoOriginal').innerText = reporte.descripcion || "Sin detalle disponible";
    }

    document.getElementById('infoReporte').innerText = `Gestionando: ${tipoDoc}`;
    document.getElementById('modalGestion').style.display = 'block';
}

async function guardarGestion() {
    const comentario = document.getElementById('comentarioGestion').value;
    const nuevoEstado = document.getElementById('nuevoEstado').value;

    if (!comentario) return alert("Escribe un comentario para la auditoría.");

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
            alert("✅ Gestión guardada con éxito.");
            cerrarModal();
            cargarDataDashboard(); 
        } else {
            alert("❌ Error: " + result.mensaje);
        }
    } catch (error) {
        alert("❌ Error al conectar con el servidor.");
    }
}

function cerrarModal() {
    document.getElementById('modalGestion').style.display = 'none';
    document.getElementById('comentarioGestion').value = '';
}

// Inicialización
window.onload = cargarDataDashboard;