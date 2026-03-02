// Variables globales para el estado del Dashboard
let dataGlobal = [];
let myDoughnutChart = null;
let myBarChart = null;
let reporteSeleccionado = null;

/**
 * 1. CARGA INICIAL: Obtiene la data unificada de la 'licuadora'
 */
async function cargarDataDashboard() {
    try {
        const response = await fetch('/equipos-empoderados/retro/consolidado-valle');
        const result = await response.json();
        
        if (result.exito) {
            dataGlobal = result.data;
            renderizarTodo(); 
        }
    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        alert("❌ No se pudo conectar con la base de datos de Atlas.");
    }
}

/**
 * 2. RENDERIZAR TODO: Orquestador de filtros y visualizaciones
 */
function renderizarTodo() {
    const cd = document.getElementById('filtroCD').value;
    const mesFiltro = document.getElementById('filtroMes').value; 
    
    // FILTRADO DINÁMICO
    let filtrados = dataGlobal;

    // Filtro por Centro de Distribución
    if (cd !== 'TODOS') {
        filtrados = filtrados.filter(d => d.cd === cd);
    }

    // Filtro por Mes con Validación de Fecha
    if (mesFiltro) {
        filtrados = filtrados.filter(d => {
            const fechaBruta = d.fecha || d.fecha_creacion;
            if (!fechaBruta) return false; 
            const fechaItem = new Date(fechaBruta);
            const mesItem = `${fechaItem.getFullYear()}-${String(fechaItem.getMonth() + 1).padStart(2, '0')}`;
            return mesItem === mesFiltro;
        });
    }

    // ACTUALIZAR CONTADORES SUPERIORES
    document.getElementById('totalNovedades').innerText = filtrados.filter(d => d.tipoDoc === 'Novedad').length;
    document.getElementById('totalPorques').innerText = filtrados.filter(d => d.tipoDoc === '5 Porqués').length;
    document.getElementById('totalPendientes').innerText = filtrados.filter(d => d.estado === 'Pendiente').length;

    // ACTUALIZAR COMPONENTES VISUALES
    actualizarGraficoEfectividad(filtrados);
    actualizarGraficoPlacas(filtrados);
    actualizarTablaAuditoria(filtrados);
}

/**
 * 3. GRÁFICO DE DONA: Nivel de Cierre con % en el centro
 */
function actualizarGraficoEfectividad(items) {
    const realizados = items.filter(d => d.estado === 'Realizado').length;
    const pendientes = items.filter(d => d.estado !== 'Realizado').length;
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
 * 4. GRÁFICO DE BARRAS: Top Placas Ofensoras
 */
function actualizarGraficoPlacas(items) {
    const conteo = {};
    items.forEach(i => conteo[i.placa] = (conteo[i.placa] || 0) + 1);
    
    const sortedPlacas = Object.entries(conteo)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const labels = sortedPlacas.map(p => p[0]);
    const valores = sortedPlacas.map(p => p[1]);

    const ctx = document.getElementById('chartTopPlacas').getContext('2d');
    if (myBarChart) myBarChart.destroy();
    
    myBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Incidentes',
                data: valores,
                backgroundColor: '#c8102e'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, grid: { color: '#333' } } }
        }
    });
}

/**
 * 5. TABLA DE AUDITORÍA Y GESTIÓN
 */
function actualizarTablaAuditoria(items) {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');
        const fecha = new Date(item.fecha || item.fecha_creacion).toLocaleDateString();
        const estadoClase = item.estado.toLowerCase().replace(/\s+/g, '-');
        
        tr.innerHTML = `
            <td>${item.icono} ${item.tipoDoc}</td>
            <td>${item.cd}</td>
            <td><strong>${item.placa}</strong></td>
            <td>${fecha}</td>
            <td><span class="badge ${estadoClase}">${item.estado}</span></td>
            <td><button class="btn-gestionar" onclick="abrirModalGestion('${item._id}', '${item.tipoDoc}')">⚙️ Gestionar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 6. LÓGICA DEL MODAL
 */
function abrirModalGestion(id, tipoDoc) {
    // Buscamos el reporte específico en nuestra 'licuadora'
    const reporte = dataGlobal.find(item => item._id === id);
    reporteSeleccionado = { id, tipoDoc };

    if (reporte) {
        // Identificamos qué texto mostrar según el tipo de documento
        const textoParaMostrar = (tipoDoc === 'Novedad') 
            ? reporte.observacion 
            : `Causa Raíz: ${reporte.causa_raiz} | Plan: ${reporte.plan_accion}`;

        document.getElementById('detalleTextoOriginal').innerText = textoParaMostrar;
    }

    document.getElementById('infoReporte').innerText = `Gestionando: ${tipoDoc}`;
    document.getElementById('modalGestion').style.display = 'block';
}

async function guardarGestion() {
    const comentario = document.getElementById('comentarioGestion').value;
    const nuevoEstado = document.getElementById('nuevoEstado').value;

    if (!comentario) {
        alert("Por favor escribe un comentario para la auditoría.");
        return;
    }

    try {
        const response = await fetch('/equipos-empoderados/retro/gestionar-reporte', {
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
        }
    } catch (error) {
        alert("❌ Error al conectar con el servidor.");
    }
}

function cerrarModal() {
    document.getElementById('modalGestion').style.display = 'none';
    document.getElementById('comentarioGestion').value = '';
}

// Inicialización al cargar la ventana
window.onload = cargarDataDashboard;