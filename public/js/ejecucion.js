document.addEventListener('DOMContentLoaded', () => {

    const btnConsultar = document.querySelector('.btn-consultar');
    const filterCd = document.getElementById('filter-cd');
    const filterMes = document.getElementById('filter-mes');
    const filterCedula = document.getElementById('filter-cedula');
    const nombreColaborador = document.getElementById('nombre-colaborador');

    const sopTargetName = document.getElementById('sop-target-name');
    const sopItems = document.querySelectorAll('.sop-item');

    let chartHistorico = null;

    /**
     * =====================================================
     * FILTRADO VISUAL DE SOP
     * =====================================================
     */

    function actualizarSOP() {

        const selectedCd = filterCd.value;
        const cdText = filterCd.options[filterCd.selectedIndex].text;

        if (sopTargetName) {
            sopTargetName.innerText = `${cdText} + Zona Valle`;
        }

        sopItems.forEach(item => {

            const itemCd = item.getAttribute('data-cd');

            item.style.display =
                (itemCd === 'ALL' || itemCd === selectedCd)
                    ? 'flex'
                    : 'none';
        });
    }

    filterCd.addEventListener('change', actualizarSOP);

    actualizarSOP();

    /**
     * =====================================================
     * CONSULTA PRINCIPAL
     * =====================================================
     */

    btnConsultar.addEventListener('click', async () => {

        const cd = filterCd.value;
        const mes = filterMes.value;
        const cedula = filterCedula.value.trim();

        if (!cedula) {
            alert('Por favor, ingrese una cédula válida.');
            return;
        }

        btnConsultar.innerText = 'Consultando...';
        btnConsultar.disabled = true;

        try {

            const response = await fetch(
                `/api/ejecucion/kpis?cd=${cd}&mes=${mes}&cedula=${encodeURIComponent(cedula)}`
            );

            const data = await response.json();

            if (data.success) {

                renderKpis(data);

                // ✅ CARGAR HISTÓRICO
                await cargarHistorico(cd, cedula);

            } else {

                alert(data.message || 'No se encontraron datos.');

                resetKpiCards();
            }

        } catch (error) {

            console.error('Error en fetch:', error);

            alert('Error al conectar con el servidor operativo.');

            resetKpiCards();

        } finally {

            btnConsultar.innerText = 'Consultar Desempeño';
            btnConsultar.disabled = false;
        }
    });

    /**
     * =====================================================
     * RENDER KPIs
     * =====================================================
     */

    function renderKpis(data) {

        const kpiCards = document.querySelectorAll('.kpi-card');

        if (nombreColaborador) {
            nombreColaborador.innerText =
                data.nombre || 'Colaborador encontrado';
        }

        const mapping = [
            { key: 'tml', index: 0 },
            { key: 'tr', index: 1 },
            { key: 'tv', index: 2 },
            { key: 'roturas', index: 3 },
            { key: 'excesos_jl', index: 4 }
        ];

        mapping.forEach(item => {

            const card = kpiCards[item.index];
            const kpiData = data[item.key];

            if (!card || !kpiData) return;

            const valueEl = card.querySelector('.kpi-value');

            if (valueEl) {
                valueEl.innerText = kpiData.valor;
            }

            card.classList.remove(
                'status-ok',
                'status-alert',
                'status-critical'
            );

            if (kpiData.clase) {
                card.classList.add(kpiData.clase);
            }
        });
    }

    /**
     * =====================================================
     * HISTÓRICO DEL COLABORADOR
     * =====================================================
     */

    async function cargarHistorico(cd, cedula) {

        try {

            const response = await fetch(
                `/api/ejecucion/historico?cd=${cd}&cedula=${cedula}`
            );

            const result = await response.json();

            if (!result.success) return;

            const data = result.data;

            const labels = data.map(d => d.mes);

            const tml = data.map(d => d.tml);
            const tr = data.map(d => d.tr);
            const tv = data.map(d => d.tv);

            const ctx = document
                .getElementById('grafica-historico')
                .getContext('2d');

            // destruir gráfica previa
            if (chartHistorico) {
                chartHistorico.destroy();
            }

            chartHistorico = new Chart(ctx, {

                type: 'line',

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: 'TML',
                            data: tml,
                            borderColor: '#ff4d4d',
                            backgroundColor: '#ff4d4d',
                            tension: 0.3
                        },
                        {
                            label: 'TR',
                            data: tr,
                            borderColor: '#00d26a',
                            backgroundColor: '#00d26a',
                            tension: 0.3
                        },
                        {
                            label: 'TV',
                            data: tv,
                            borderColor: '#f5b301',
                            backgroundColor: '#f5b301',
                            tension: 0.3
                        }
                    ]
                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {
                            labels: {
                                color: 'white'
                            }
                        }
                    },

                    scales: {

                        x: {
                            ticks: {
                                color: 'white'
                            }
                        },

                        y: {
                            ticks: {
                                color: 'white'
                            }
                        }
                    }
                }
            });

        } catch (error) {

            console.error('Error histórico:', error);
        }
    }

    /**
     * =====================================================
     * RESET VISUAL
     * =====================================================
     */

    function resetKpiCards() {

        document.querySelectorAll('.kpi-card').forEach(card => {

            const valueEl = card.querySelector('.kpi-value');

            if (valueEl) {
                valueEl.innerText = '--';
            }

            card.classList.remove(
                'status-ok',
                'status-alert',
                'status-critical'
            );
        });

        if (nombreColaborador) {
            nombreColaborador.innerText = 'Sin consulta activa';
        }

        // destruir gráfica si hay error
        if (chartHistorico) {
            chartHistorico.destroy();
        }
    }

});