/* ==========================================================================
   CONFIGURACIÓN Y CONSTANTES
   ========================================================================== */
const CONFIG = {
    CLIENTES_URL: "/pilares/delivery/clientes/",
    MODULOS_BASE_URL: "/api/get-modulo/",
    RUTAS_ESTATICAS: {
        ejecucion: "/ejecucion-entrega",
        equipos: "/equipos-empoderados",
        rta: "/gestion-rta",
        mejora: "/mejora-entrega" // Aseguramos ruta para Mejora independiente
    }
};

/* ==========================================================================
   GESTIÓN DE TEMA (DARK / LIGHT)
   ========================================================================== */
const ThemeManager = {
    set(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("tema_portal", theme);
    },
    toggle() {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        this.set(current === "dark" ? "light" : "dark");
    },
    init() {
        const saved = localStorage.getItem("tema_portal");
        if (saved) this.set(saved);
    }
};

/* ==========================================================================
   NAVEGACIÓN Y LÓGICA DE MÓDULOS
   ========================================================================== */
const Navigation = {
    abrirClientes() {
        window.open(CONFIG.CLIENTES_URL, "_blank", "noopener,noreferrer");
    },

    manejarClicModulo(event) {
        // Detectamos la tarjeta (modulo-item)
        const item = event.target.closest('.modulo-item');
        
        // 1. Validaciones previas
        if (!item || item.classList.contains('upcoming')) return;

        // 2. Identificación del módulo
        const moduloID = item.dataset.modulo;
        
        // 3. Lógica de navegación: Priorizamos el enlace interno si existe
        const link = item.querySelector('a.modulo-action-btn');
        const internalHref = link ? link.getAttribute('href') : null;

        console.log(`Iniciando navegación para: ${moduloID}`);

        if (internalHref && internalHref !== "#") {
            window.location.href = internalHref;
        } else if (CONFIG.RUTAS_ESTATICAS[moduloID]) {
            window.location.href = CONFIG.RUTAS_ESTATICAS[moduloID];
        } else {
            // 4. Fallback: Carga dinámica si no hay ruta estática
            this.cargarModuloDinamico(moduloID);
        }
    },

    async cargarModuloDinamico(nombre) {
        const container = document.getElementById('main-content');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.MODULOS_BASE_URL}${nombre}`);
            if (!response.ok) throw new Error('Error al cargar el módulo');
            
            const html = await response.text();
            container.innerHTML = html;
        } catch (error) {
            console.error("Error en carga dinámica:", error);
        }
    }
};

/* ==========================================================================
   INICIALIZACIÓN ÚNICA DEL DOM
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar Preferencias (Tema)
    ThemeManager.init();

    // 2. Elementos de Interfaz Dinámica
    const anioEl = document.getElementById("anio");
    if (anioEl) anioEl.textContent = new Date().getFullYear();

    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('es-ES', options);
    }

    // 3. Event Listeners Globales (Controles)
    const btnTema = document.getElementById("btnTema");
    if (btnTema) btnTema.addEventListener("click", () => ThemeManager.toggle());

    const btnClientes = document.getElementById("btnClientes");
    if (btnClientes) btnClientes.addEventListener("click", () => Navigation.abrirClientes());

    // 4. Delegación de Eventos para Módulos (Optimización de Memoria)
    const modulosList = document.getElementById('modulos-list');
    if (modulosList) {
        modulosList.addEventListener('click', (e) => {
            // Prevenimos comportamiento por defecto si es un botón de acción
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                // Dejamos que el enlace funcione normalmente o lo manejamos en manejarClicModulo
            }
            Navigation.manejarClicModulo(e);
        });
    }
});