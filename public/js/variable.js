document.addEventListener("DOMContentLoaded", () => {
    const cedulaInput = document.getElementById("cedula");
    const btnConsultar = document.getElementById("btn-consultar");
    const mesSelect = document.getElementById("mes-select");
    const selectorContainer = document.getElementById("selector-mes-container");
    const dashboard = document.getElementById("dashboard");
    const loader = document.getElementById("loader");
    const errorContainer = document.getElementById("error-container");
    const errorText = document.getElementById("error-text");
    const btnToggleDetalle = document.getElementById("btn-toggle-detalle");
    const detalleSection = document.getElementById("detalle-diario-section");

    btnConsultar.addEventListener("click", async () => {
        const id = cedulaInput.value.trim();

        if (!/^[0-9]+$/.test(id)) {
            showError("Cédula inválida. Use solo números.");
            return;
        }

        resetUI();
        toggleLoader(true);

        try {
            const res = await fetch(`/api/variable/meses/${id}`);
            const data = await res.json();

            if (data.success && data.meses.length > 0) {
                renderMeses(data.meses);
                selectorContainer.classList.remove("hidden");
            } else {
                showError("No se encontraron registros para esta cédula.");
            }
        } catch (error) {
            showError("Error al conectar con el servidor.");
        } finally {
            toggleLoader(false);
        }
    });

    mesSelect.addEventListener("change", async () => {
        const id = cedulaInput.value.trim();
        const mes = mesSelect.value;

        errorContainer.classList.add("hidden");
        dashboard.classList.add("hidden");
        detalleSection.classList.add("hidden");
        toggleLoader(true);

        try {
            const res = await fetch(`/api/variable/resumen/${id}?mes=${mes}`);
            const data = await res.json();

            if (data.success) {
                renderResumen(data);
            } else {
                showError(data.message || "Error al obtener el resumen oficial.");
            }
        } catch (error) {
            showError("Error al procesar la información mensual.");
        } finally {
            toggleLoader(false);
        }
    });

    btnToggleDetalle.addEventListener("click", async () => {
        if (!detalleSection.classList.contains("hidden")) {
            detalleSection.classList.add("hidden");
            return;
        }

        const id = cedulaInput.value.trim();
        const mes = mesSelect.value;

        if (!id || !mes) {
            showError("Debe consultar una cédula y seleccionar un mes.");
            return;
        }

        toggleLoader(true);

        try {
            const res = await fetch(`/api/variable/detalle/${id}?mes=${mes}`);
            const data = await res.json();

            if (data.success) {
                renderDetalle(data.detalles || []);
                detalleSection.classList.remove("hidden");
            } else {
                showError(data.message || "No se pudo cargar el detalle diario.");
            }
        } catch (error) {
            showError("Error al cargar el detalle diario.");
        } finally {
            toggleLoader(false);
        }
    });

    function renderResumen(d) {
        document.getElementById("user-name").innerText = d.nombre || "Sin nombre";
        document.getElementById("user-info-sub").innerText = `${d.cargo || "Sin cargo"} | CD ${d.cd || "-"}`;

        const pctStr = d.porcentaje_variable || "0%";
        const pctNum = parseFloat(String(pctStr).replace("%", "")) || 0;

        const textoElement = document.getElementById("badge-porcentaje");
        const fillElement = document.getElementById("gauge-fill");

        textoElement.innerText = pctStr;

        const rotation = Math.min(pctNum, 100) / 100 / 2;
        fillElement.style.transform = `rotate(${rotation}turn)`;

        fillElement.classList.remove("gauge-gold", "gauge-white", "gauge-red");

        if (pctNum >= 100) {
            fillElement.classList.add("gauge-gold");
        } else if (pctNum > 0) {
            fillElement.classList.add("gauge-white");
        } else {
            fillElement.classList.add("gauge-red");
        }

        document.getElementById("valor-pago-dt").innerText = fmtCur(d.pago_variable_dt);
        document.getElementById("valor-salario-base").innerText = fmtCur(d.salario_variable);
        document.getElementById("valor-dias").innerText = d.dias_trabajados ?? 0;
        document.getElementById("valor-aus-just").innerText = d.ausencia_justificada ?? 0;
        document.getElementById("valor-aus-injust").innerText = d.ausencia_injustificada ?? 0;

        dashboard.classList.remove("hidden");
    }

    function renderDetalle(lista) {
        const body = document.getElementById("body-detalle");
        body.innerHTML = "";

        if (!lista || lista.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center">Sin detalle disponible</td>
                </tr>
            `;
            return;
        }

        const rows = lista.map(item => {
            let rowClass = "row-neutral";

            if (!item.asistencia || Number(item.monto) === 0) {
                rowClass = "row-danger";
            } else if (Number(item.monto) > 0) {
                rowClass = "row-success";
            }

            const rechazosInfo = formatRechazos(item.rechazos);

            return `
                <tr class="${rowClass}">
                    <td data-label="Fecha">${item._id || "-"}</td>
                    <td data-label="Estado">${item.estado_label || "-"}</td>
                    <td data-label="Rechazos" class="${rechazosInfo.className}">
                       ${rechazosInfo.text}
                    </td>
                    <td data-label="Cumplimiento">${formatPercent(item.cumplimiento)}</td>
                    <td data-label="Monto Ref.">${fmtCur(item.monto)}</td>
                </tr>
            `;
        }).join("");

        body.innerHTML = rows;
    }

    function formatRechazos(value) {
        if (value === null || value === undefined || value === "") {
            return { text: "-", className: "rechazo-neutral" };
        }

        const numberValue = parseFloat(String(value).replace(",", "."));

        if (Number.isNaN(numberValue)) {
            return { text: "-", className: "rechazo-neutral" };
        }

        const porcentaje = numberValue * 100;
        const text = `${porcentaje.toFixed(2)}%`;
        const className = porcentaje < 2 ? "rechazo-ok" : "rechazo-alerta";

        return { text, className };
    }

    function formatPercent(value) {
        if (value === null || value === undefined || value === "") return "-";

        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) return "-";

        return `${numberValue.toFixed(0)}%`;
    }

    function fmtCur(value) {
        const numberValue = Number(value) || 0;

        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }).format(numberValue);
    }

    function toggleLoader(show) {
        loader.classList.toggle("hidden", !show);
    }

    function showError(message) {
        errorText.innerText = message;
        errorContainer.classList.remove("hidden");
    }

    function resetUI() {
        dashboard.classList.add("hidden");
        selectorContainer.classList.add("hidden");
        errorContainer.classList.add("hidden");
        detalleSection.classList.add("hidden");
        mesSelect.innerHTML = '<option value="" disabled selected>Seleccione mes...</option>';
    }

    function renderMeses(meses) {
        mesSelect.innerHTML = '<option value="" disabled selected>Seleccione mes...</option>';

        meses.forEach(mes => {
            mesSelect.innerHTML += `<option value="${mes}">${mes}</option>`;
        });
    }
});