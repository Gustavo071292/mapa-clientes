from fastapi import APIRouter

from models.cinco_porques_dto import (
    CincoPorquesRequest,
    CincoPorquesResponse
)
from services.cinco_porques_service import (
    procesar_analisis_cinco_porques
)


router = APIRouter(
    prefix="/ai/cinco-porques",
    tags=["Motor IA - 5 Porqués"]
)


@router.post(
    "/analizar",
    response_model=CincoPorquesResponse
)
def analizar_respuesta_porque(
    payload: CincoPorquesRequest
):
    try:
        resultado = procesar_analisis_cinco_porques(
            payload.model_dump()
        )

        return resultado

    except Exception as error:
        print(
            "[Log Servidor - Excepción Router]: "
            f"{str(error)}"
        )

        return {
            "ia_disponible": False,
            "estado": None,
            "evaluacion": None,
            "pregunta_siguiente": None,
            "opciones": [],
            "historicos_utilizados": 0,
            "requiere_aclaracion": False,
            "mensaje": (
                "El asistente de IA se encuentra "
                "temporalmente indisponible. "
                "El análisis puede continuar de forma manual."
            )
        }