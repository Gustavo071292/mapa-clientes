document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const btnConsultar = document.getElementById('btn-consultar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const tableBody = document.getElementById('kpi-table-body');
    const execHeader = document.getElementById('executive-header');
    
    // Inputs
    const inputCd = document.getElementById('filter-cd');
    const inputFecha = document.getElementById('filter-fecha');
    const inputCedula = document.getElementById('filter-cedula');

    // Labels Header
    const lblNombre = document.getElementById('display-nombre');
    const lblPlaca = document.getElementById('display-placa');
    const lblTransporte = document.getElementById('display-transporte');

    /**
     * Consulta al Backend
     */
    const consultarDesempeno = async () => {
        const cd = inputCd.value;
        const fecha = inputFecha.value;
        const cedula = inputCedula.value.trim();

        if (!fecha || !cedula) {
            alert("Por favor complete Fecha y Cédula.");
            return;
        }

        // UI Loading
        btnConsultar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
        btnConsultar.disabled = true;

        try {
            const response = await fetch(`/api/desempeno-kpi/consulta?cd=${cd}&fecha=${fecha}&cedula=${cedula}`);
            const data = await response.json();

            if (data.success) {
                renderDashboard(data);
            } else {
                alert(data.message || "No se encontraron datos para esta consulta.");
                resetDashboard();
            }
        } catch (error) {
            console.error("Error en fetch:", error);
            alert("Error de conexión con el servidor operativo.");
        } finally {
            btnConsultar.innerHTML = '<i class="fas fa-search"></i> Consultar';
            btnConsultar.disabled = false;
        }
    };

    /**
     * Renderiza los datos en la UI
     */
    const renderDashboard = (data) => {
        // 1. Mostrar Header Ejecutivo
        execHeader.style.display = 'grid';
        lblNombre.innerText = data.header.nombre || "No identificado";
        lblPlaca.innerText = data.header.placa || "--";
        lblTransporte.innerText = data.header.transporte || "--";

        // 2. Limpiar Tabla
        tableBody.innerHTML = '';

        // 3. Renderizar Filas de KPIs
        data.tabla_desempeno.forEach(row => {
            const tr = document.createElement('tr');
            
            // Lógica de clase CSS según estado del backend
            const statusClass = `status-${row.evaluacion.estado}`;
            
            // Lógica de Herramienta de Gestión
            let gestionCol = `<span class="no-gestion">No requiere gestión</span>`;
            if (row.evaluacion.gestion_activa) {
                gestionCol = `
                    <a href="${row.evaluacion.url}" class="btn-gestion">
                        <i class="fas fa-external-link-alt"></i> Gestionar en 2.2
                    </a>`;
            }

            tr.innerHTML = `
                <td><strong>${row.kpi_impactado}</strong></td>
                <td>${row.indicador_pi}</td>
                <td class="text-dim">${row.unidad}</td>
                <td>${row.meta}</td>
                <td>${row.disparador}</td>
                <td class="text-center">
                    <span class="badge-result ${statusClass}">${row.resultado_display}</span>
                </td>
                <td class="text-center">${gestionCol}</td>
            `;
            tableBody.appendChild(tr);
        });
    };

    /**
     * Limpia la interfaz
     */
    const resetDashboard = () => {
        inputCedula.value = '';
        tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">Ingrese filtros para visualizar el desempeño operativo.</td>
            </tr>`;
        execHeader.style.display = 'none';
    };

    // Eventos
    btnConsultar.addEventListener('click', consultarDesempeno);
    btnLimpiar.addEventListener('click', resetDashboard);

    // Permitir Enter en el campo cédula
    inputCedula.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') consultarDesempeno();
    });
});