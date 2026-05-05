document.addEventListener("DOMContentLoaded", () => {

    const selectCD = document.getElementById("filter-cd");
    const sopItems = document.querySelectorAll(".sop-item");
    const contextText = document.getElementById("sop-target-name");

    function actualizarSOP() {
        const cd = selectCD.value;

        // Cambia el texto arriba
        contextText.textContent = cd;

        sopItems.forEach(item => {
            const itemCD = item.getAttribute("data-cd");

            if (itemCD === "ALL" || itemCD === cd) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    }

    // Evento cuando cambias CD
    selectCD.addEventListener("change", actualizarSOP);

    // Ejecutar al cargar
    actualizarSOP();
});