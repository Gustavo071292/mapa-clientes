from fastapi import APIRouter, HTTPException
from services.auditor_clientes import analizar_calidad_clientes

# Inicializamos el router con un prefijo para agrupar las rutas de auditoría
router = APIRouter(
    prefix="/audit",
    tags=["Auditoría de Calidad de Datos"]
)

@router.get("/clientes-resumen")
def obtener_auditoria_clientes():
    try:
        # Llamamos al servicio para procesar la auditoría en modo lectura
        resultado = analizar_calidad_clientes()
        
        if "error" in resultado:
            raise HTTPException(status_code=500, detail=resultado["error"])
            
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el servidor de auditoría: {str(e)}")