const RTADashboard = {
    allData: [],
    chartInstance: null,
    statusChartInstance: null,
    trendChartInstance: null,
    currentRtaId: null,

    formatDate(value, fallback = "-") {
        if (!value) return fallback;

        const date = new Date(value);
        if (isNaN(date.getTime())) return fallback;

        return date.toLocaleDateString();
    },

    getOperationalDate(item) {
        return item.fechaHallazgo || item.fecha_creacion || null;
    },

    renderChart(data) {
        const canvas = document.getElementById('chart-rta-cd');
        if (!canvas || !Array.isArray(data)) return;

        const ctx = canvas.getContext('2d');

        const conteoPorCD = data.reduce((acc, item) => {
            const cdName = item.cd || item.centroDistribucion || "Sin CD";
            acc[cdName] = (acc[cdName] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(conteoPorCD);
        const valores = Object.values(conteoPorCD);

        if (this.chartInstance) this.chartInstance.destroy();

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'RTAs por CD',
                    data: valores,
                    backgroundColor: 'rgba(212, 175, 55, 0.4)',
                    borderColor: '#d4af37',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9ca3af', stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    renderStatusChart(data) {
        const canvas = document.getElementById('chart-rta-status');
        if (!canvas || !Array.isArray(data)) return;

        const ctx = canvas.getContext('2d');

        const conteoPorEstado = data.reduce((acc, item) => {
            const estado = item.estado || "Sin Estado";
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(conteoPorEstado);
        const valores = Object.values(conteoPorEstado);

        const colorMap = {
            'Pendiente': '#c41230',
            'En Proceso': '#d4af37',
            'Cerrado': '#10b981',
            'Realizado': '#10b981'
        };

        const backgroundColors = labels.map(label => colorMap[label] || '#2d3139');

        if (this.statusChartInstance) this.statusChartInstance.destroy();

        this.statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: valores,
                    backgroundColor: backgroundColors,
                    borderColor: '#0a0c0e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9ca3af',
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    },

    renderTrendChart(data) {
        const canvas = document.getElementById('chart-rta-trend');
        if (!canvas || !Array.isArray(data)) return;

        const ctx = canvas.getContext('2d');

        const grouping = data.reduce((acc, item) => {
            const dateValue = this.getOperationalDate(item);
            if (!dateValue) return acc;

            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return acc;

            const monthIndex = date.getMonth();
            const year = date.getFullYear();

            const label = date.toLocaleString('es-ES', {
                month: 'long',
                year: 'numeric'
            });

            const sortKey = (year * 12) + monthIndex;

            if (!acc[sortKey]) {
                acc[sortKey] = {
                    label: label.charAt(0).toUpperCase() + label.slice(1),
                    count: 0
                };
            }

            acc[sortKey].count++;
            return acc;
        }, {});

        const sortedKeys = Object.keys(grouping).sort((a, b) => a - b);
        const labels = sortedKeys.map(key => grouping[key].label);
        const valores = sortedKeys.map(key => grouping[key].count);

        if (this.trendChartInstance) this.trendChartInstance.destroy();

        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'RTAs Registrados',
                    data: valores,
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#c41230',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9ca3af', stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    init() {
        this.fetchData();
        this.setupEventListeners();
    },

    async fetchData() {
        try {
            const response = await fetch('/api/rta/listar-rta');
            const result = await response.json();

            if (result.exito && result.data) {
                this.allData = result.data;
                this.renderDashboard(this.allData);
            } else {
                this.showError("No se pudieron cargar los datos.");
            }
        } catch (error) {
            console.error("Error fetching RTA:", error);
            this.showError("Error de conexión con el servidor.");
        }
    },

    setupEventListeners() {
        const searchInput = document.getElementById('filter-search');
        const cdFilter = document.getElementById('filter-cd');
        const estadoFilter = document.getElementById('filter-estado');
        const listBody = document.getElementById('rta-list-body');
        const mobileContainer = document.getElementById('rta-mobile-container');
        const formGestion = document.getElementById('form-gestion-preview');
        const btnClose = document.getElementById('btn-close-modal');
        const toggleResumen = document.getElementById('toggle-resumen');

        if (formGestion) {
            formGestion.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitGestion();
            });
        }

        if (listBody) {
            listBody.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-action')) {
                    this.openModal(e.target.dataset.id);
                }
            });
        }

        if (mobileContainer) {
            mobileContainer.addEventListener('click', (e) => {
                const button = e.target.closest('[data-id]');
                if (button) this.openModal(button.dataset.id);
            });
        }

        if (btnClose) {
            btnClose.onclick = () => this.closeModal();
        }

        if (toggleResumen) {
            toggleResumen.addEventListener('click', () => {
                const detalle = document.getElementById('detalle-expandido');
                if (!detalle) return;

                detalle.classList.toggle('hidden');

                toggleResumen.textContent = detalle.classList.contains('hidden')
                    ? 'VER RESUMEN EJECUTIVO'
                    : 'OCULTAR RESUMEN';
            });
        }

        const applyFilters = () => {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
            const selectedCD = cdFilter ? cdFilter.value : "";
            const selectedEstado = estadoFilter ? estadoFilter.value : "";

            const filtered = this.allData.filter(item => {
                const matchesSearch =
                    (item.ejecutor?.toLowerCase().includes(searchTerm)) ||
                    (item.descripcionAnomalia?.toLowerCase().includes(searchTerm)) ||
                    (item.tipoAnomalia?.toLowerCase().includes(searchTerm));

                const matchesCD = selectedCD === "" || (item.cd || item.centroDistribucion) === selectedCD;
                const matchesEstado = selectedEstado === "" || item.estado === selectedEstado;

                return matchesSearch && matchesCD && matchesEstado;
            });

            this.renderDashboard(filtered);
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (cdFilter) cdFilter.addEventListener('change', applyFilters);
        if (estadoFilter) estadoFilter.addEventListener('change', applyFilters);
    },

    renderDashboard(data) {
        this.updateMetrics(data);
        this.renderTable(data);
        this.renderMobileCards(data);
        this.renderChart(data);
        this.renderStatusChart(data);
        this.renderTrendChart(data);
    },

    updateMetrics(data) {
        const statTotal = document.getElementById('stat-total');
        const statPending = document.getElementById('stat-pending');
        const statProcess = document.getElementById('stat-process');
        const statClosed = document.getElementById('stat-closed');

        if (statTotal) statTotal.textContent = data.length;
        if (statPending) statPending.textContent = data.filter(item => item.estado === 'Pendiente').length;
        if (statProcess) statProcess.textContent = data.filter(item => item.estado === 'En Proceso').length;
        if (statClosed) {
            statClosed.textContent = data.filter(item =>
                item.estado === 'Cerrado' || item.estado === 'Realizado'
            ).length;
        }
    },

    renderTable(data) {
        const tbody = document.getElementById('rta-list-body');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No se encontraron registros</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${this.formatDate(this.getOperationalDate(item))}</td>
                <td>${item.cd || item.centroDistribucion || '-'}</td>
                <td>${item.kpi || '-'}</td>
                <td>${item.tipoAnomalia || '-'}</td>
                <td><span class="badge status-${this.slugify(item.estado)}">${item.estado || '-'}</span></td>
                <td>
                    <button class="btn-action" data-id="${item._id}">Ver</button>
                </td>
            </tr>
        `).join('');
    },

    renderMobileCards(data) {
        const container = document.getElementById('rta-mobile-container');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay reportes disponibles</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="card rta-card-mobile">
                <div class="card-header">
                    <strong>${this.formatDate(this.getOperationalDate(item))}</strong>
                    <span class="badge status-${this.slugify(item.estado)}">${item.estado || '-'}</span>
                </div>
                <div class="card-body">
                    <p><strong>CD:</strong> ${item.cd || item.centroDistribucion || '-'}</p>
                    <p><strong>KPI:</strong> ${item.kpi || '-'}</p>
                    <p><strong>Anomalía:</strong> ${item.tipoAnomalia || '-'}</p>
                </div>
                <div class="card-footer">
                    <button class="btn-cta btn-secondary full-width" data-id="${item._id}">Ver Detalle</button>
                </div>
            </div>
        `).join('');
    },

    showError(msg) {
        const tbody = document.getElementById('rta-list-body');
        const container = document.getElementById('rta-mobile-container');
        const errorHtml = `<tr><td colspan="6" class="error-msg">${msg}</td></tr>`;

        if (tbody) tbody.innerHTML = errorHtml;
        if (container) container.innerHTML = `<p class="error-msg">${msg}</p>`;
    },

    slugify(text) {
        return text
            ? text.toString().toLowerCase().trim().replace(/\s+/g, '-')
            : '';
    },

    openModal(id) {
        const rta = this.allData.find(item => item._id === id);
        if (!rta) return;

        this.currentRtaId = id;

        document.getElementById('det-id-badge').textContent = `#${id.slice(-6).toUpperCase()}`;

        document.getElementById('det-fecha').textContent =
            this.formatDate(this.getOperationalDate(rta), 'N/A');

        document.getElementById('det-cd').textContent = rta.cd || rta.centroDistribucion || 'N/A';
        document.getElementById('det-kpi').textContent = rta.kpi || 'N/A';
        document.getElementById('det-ejecutor').textContent = rta.ejecutor || 'No asignado';
        document.getElementById('det-anomalia').textContent = rta.tipoAnomalia || 'Sin especificar';
        document.getElementById('det-desc').textContent = rta.descripcionAnomalia || 'Sin descripción detallada';

        const detalleExpandido = document.getElementById('detalle-expandido');
        const toggleResumen = document.getElementById('toggle-resumen');

        if (detalleExpandido) {
            detalleExpandido.classList.add('hidden');

            detalleExpandido.innerHTML = `
                <div class="detalle-grid">

                    <div class="detalle-card"><span class="detalle-label">NEGOCIO</span><p>${rta.negocio || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">CD</span><p>${rta.cd || rta.centroDistribucion || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">EQUIPO</span><p>${rta.equipo || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">KPI</span><p>${rta.kpi || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">TIPO ANOMALÍA</span><p>${rta.tipoAnomalia || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">TIPO EVENTO</span><p>${rta.tipoEvento || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">DESCRIPCIÓN ANOMALÍA</span><p>${rta.descripcionAnomalia || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">DESCRIPCIÓN PROBLEMA</span><p>${rta.descripcionProblema || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">¿QUÉ SE DETECTÓ?</span><p>${rta.queDetecto || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">¿CUÁNDO SE DETECTÓ?</span><p>${this.formatDate(rta.cuandoDetecto)}</p></div>
                    <div class="detalle-card"><span class="detalle-label">¿DÓNDE SE DETECTÓ?</span><p>${rta.dondeDetecto || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">¿QUIÉN DETECTÓ?</span><p>${rta.quienDetecto || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">¿QUIÉN INTERVINO?</span><p>${rta.quienIntervino || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">PUNTO #1</span><p>${rta.punto1 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">RESULTADO #1</span><p>${rta.resultado1 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">ACCIÓN #1</span><p>${rta.accion1 || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">PUNTO #2</span><p>${rta.punto2 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">RESULTADO #2</span><p>${rta.resultado2 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">ACCIÓN #2</span><p>${rta.accion2 || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">PUNTO #3</span><p>${rta.punto3 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">RESULTADO #3</span><p>${rta.resultado3 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">ACCIÓN #3</span><p>${rta.accion3 || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">SOP DISPONIBLE</span><p>${rta.sopDisponible || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">SOP APLICABLE</span><p>${rta.sopAplicable || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">SOP REVISAR</span><p>${rta.sopRevisar || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">CAPACITACIÓN</span><p>${rta.sopCapacitacion || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">SOP IMPLEMENTADO</span><p>${rta.sopImplementado || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">REINCIDENCIA</span><p>${rta.reincidencia || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">POR QUÉ #1</span><p>${rta.porQue1 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">POR QUÉ #2</span><p>${rta.porQue2 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">POR QUÉ #3</span><p>${rta.porQue3 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">POR QUÉ #4</span><p>${rta.porQue4 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">POR QUÉ #5</span><p>${rta.porQue5 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">CAUSA RAÍZ</span><p>${rta.causaRaiz || '-'}</p></div>

                    <div class="detalle-card"><span class="detalle-label">PLAN ACCIÓN #1</span><p>${rta.planAccion1 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">RESPONSABLE #1</span><p>${rta.responsable1 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">FECHA CIERRE #1</span><p>${this.formatDate(rta.fechaCierre1)}</p></div>

                    <div class="detalle-card"><span class="detalle-label">PLAN ACCIÓN #2</span><p>${rta.planAccion2 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">RESPONSABLE #2</span><p>${rta.responsable2 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">FECHA CIERRE #2</span><p>${this.formatDate(rta.fechaCierre2)}</p></div>

                    <div class="detalle-card"><span class="detalle-label">PLAN ACCIÓN #3</span><p>${rta.planAccion3 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">RESPONSABLE #3</span><p>${rta.responsable3 || '-'}</p></div>
                    <div class="detalle-card"><span class="detalle-label">FECHA CIERRE #3</span><p>${this.formatDate(rta.fechaCierre3)}</p></div>

                </div>
            `;
        }

        if (toggleResumen) {
            toggleResumen.textContent = 'VER RESUMEN EJECUTIVO';
        }

        const estadoBadge = document.getElementById('det-estado-badge');
        if (estadoBadge) {
            estadoBadge.textContent = rta.estado || 'Pendiente';
            estadoBadge.className = `badge-status status-${this.slugify(rta.estado || 'Pendiente')}`;
        }

        const histContainer = document.getElementById('det-historial');

        if (histContainer) {
            if (rta.comentarios && rta.comentarios.length > 0) {
                histContainer.innerHTML = rta.comentarios.map(comment => `
                    <div class="historial-item">
                        <div class="hist-meta">
                            <span class="hist-date">${comment.fecha ? new Date(comment.fecha).toLocaleString() : '-'}</span>
                            <span class="hist-flow">${comment.estadoAnterior || '---'} ➜ ${comment.estadoNuevo || '---'}</span>
                        </div>
                        <p class="hist-text">${comment.texto || '-'}</p>
                    </div>
                `).join('');
            } else {
                histContainer.innerHTML = `<div class="empty-hist">Sin comentarios de gestión registrados.</div>`;
            }
        }

        const nuevoEstado = document.getElementById('nuevo-estado');
        if (nuevoEstado) nuevoEstado.value = rta.estado || 'Pendiente';

        const modal = document.getElementById('modal-detalle');
        if (modal) modal.style.display = 'flex';
    },

    showMessage(tipo, texto) {
        const feedback = document.getElementById('modal-feedback');
        if (!feedback) return;

        feedback.textContent = texto;
        feedback.className = `modal-feedback-box fb-${tipo}`;
        feedback.style.display = 'block';

        setTimeout(() => {
            feedback.style.display = 'none';
        }, 4000);
    },

    async submitGestion() {
        const id = this.currentRtaId;
        const nuevoEstado = document.getElementById('nuevo-estado')?.value;
        const comentario = document.getElementById('comentario-gestion')?.value.trim();
        const btnSubmit = document.querySelector('#form-gestion-preview .btn-cta');

        if (!id) return this.showMessage('error', 'No se encontró el RTA seleccionado.');
        if (!nuevoEstado) return this.showMessage('error', 'Selecciona un estado.');
        if (!comentario) return this.showMessage('error', 'Debes ingresar un comentario de gestión.');

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = "GUARDANDO...";
            }

            const response = await fetch(`/api/rta/actualizar-estado/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoEstado, comentario })
            });

            const result = await response.json();

            if (!response.ok || !result.exito) {
                return this.showMessage('error', result.mensaje || 'No se pudo actualizar la gestión.');
            }

            const comentarioInput = document.getElementById('comentario-gestion');
            if (comentarioInput) comentarioInput.value = "";

            await this.fetchData();
            this.openModal(id);
            this.showMessage('success', 'Gestión guardada correctamente.');

        } catch (error) {
            console.error("Error actualizando gestión:", error);
            this.showMessage('error', 'Error de conexión al actualizar la gestión.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "GUARDAR CAMBIOS";
            }
        }
    },

    closeModal() {
        const modal = document.getElementById('modal-detalle');
        if (modal) modal.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RTADashboard.init();
});