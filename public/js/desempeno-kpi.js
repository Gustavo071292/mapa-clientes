document.addEventListener('DOMContentLoaded', () => {
    const btnConsultar = document.getElementById('btn-consultar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const tableHead = document.getElementById('weekly-table-head');
    const tableBody = document.getElementById('weekly-table-body');
    const execHeader = document.getElementById('executive-header');
    const statusContainer = document.getElementById('status-container');

    const showMsg = (txt, type = 'info') => {
        statusContainer.innerText = txt;
        statusContainer.style.display = 'block';
        statusContainer.className = `status-container ${type === 'error' ? 'msg-error' : 'msg-info'}`;
    };

    const fetchWeekly = async () => {
        const cd = document.getElementById('filter-cd').value;
        const anio = document.getElementById('filter-anio').value;
        const semana = document.getElementById('filter-semana').value;
        const cedula = document.getElementById('filter-cedula').value.trim();

        if (!semana || !cedula) return showMsg("Ingrese semana y cédula.", "error");

        btnConsultar.disabled = true;
        btnConsultar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

        try {
            const res = await fetch(`/api/desempeno-kpi/semanal?cd=${cd}&semana=${semana}&anio=${anio}&cedula=${cedula}`);
            const data = await res.json();

            if (data.success) {
                renderTablero(data);
                showMsg(`Semana ${semana} cargada.`);
            } else {
                showMsg(data.message || "No hay datos.", "error");
                resetUI();
            }
        } catch (e) { showMsg("Error de servidor.", "error"); }
        finally {
            btnConsultar.disabled = false;
            btnConsultar.innerHTML = '<i class="fas fa-table"></i> Ver Tablero';
        }
    };

    const renderTablero = (data) => {
        execHeader.style.display = 'grid';
        document.getElementById('display-nombre').innerText = data.header.nombre;
        document.getElementById('display-info-ruta').innerText = `${data.header.placa} | ${data.header.transporte || 'PROPIO'}`;

        // QA: Header con UM y Disparador
        let headHtml = `<tr>
            <th>KPI</th>
            <th>Indicador PI</th>
            <th>UM</th>
            <th>Meta</th>
            <th>Disparador</th>
            <th>Gestión</th>`;
        data.dias.forEach(d => { headHtml += `<th class="day-cell">${d.label}</th>`; });
        headHtml += `</tr>`;
        tableHead.innerHTML = headHtml;

        tableBody.innerHTML = '';
        data.tabla_desempeno.forEach(kpi => {
            const tr = document.createElement('tr');
            let rowHtml = `
                <td><strong>${kpi.kpi_impactado}</strong></td>
                <td>${kpi.indicador_pi}</td>
                <td class="text-dim">${kpi.unidad}</td>
                <td class="text-dim">${kpi.meta}</td>
                <td class="text-dim">${kpi.disparador}</td>
                <td class="herramienta-text">${kpi.herramienta}</td>`;

            kpi.resultados.forEach(res => {
                const eval = res.evaluacion || { estado: 'neutral', gestion_activa: false };
                const click = eval.gestion_activa ? `onclick="location.href='${eval.url}'"` : '';
                rowHtml += `<td class="day-cell">
                    <span class="result-box status-${eval.estado}" ${click} ${eval.gestion_activa ? 'style="cursor:pointer"':''}>
                        ${res.resultado_display}
                    </span>
                </td>`;
            });
            tr.innerHTML = rowHtml;
            tableBody.appendChild(tr);
        });
    };

    const resetUI = () => {
        execHeader.style.display = 'none';
        tableHead.innerHTML = '';
        tableBody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px;">Sin datos.</td></tr>';
    };

    btnConsultar.addEventListener('click', fetchWeekly);
    btnLimpiar.addEventListener('click', resetUI);
});