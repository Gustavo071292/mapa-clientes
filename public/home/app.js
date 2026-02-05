const CLIENTES_URL = "/pilares/delivery/clientes/";

function setTema(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("tema_portal", theme);
}

function toggleTema(){
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  setTema(current === "dark" ? "light" : "dark");
}

function abrirClientes(){
  window.open(CLIENTES_URL, "_blank", "noopener,noreferrer");
}

document.addEventListener("DOMContentLoaded", () => {
  // Año
  const anio = document.getElementById("anio");
  if (anio) anio.textContent = new Date().getFullYear();

  // Tema
  const saved = localStorage.getItem("tema_portal");
  if (saved) setTema(saved);

  const btnTema = document.getElementById("btnTema");
  if (btnTema) btnTema.addEventListener("click", toggleTema);

  // Abrir clientes en nueva pestaña (Opción B)
  const btnClientes = document.getElementById("btnClientes");
  if (btnClientes) btnClientes.addEventListener("click", abrirClientes);
});
