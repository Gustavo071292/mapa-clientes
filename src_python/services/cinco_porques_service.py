from typing import Dict, Any

from services.historicos_service import recuperar_y_rankear_historicos
from services.ia_service import evaluar_causa_raiz_con_ia


def procesar_analisis_cinco_porques(
    data_input: Dict[str, Any]
) -> Dict[str, Any]:

    cd = data_input.get("cd")
    indicador = data_input.get("indicador")
    descripcion_novedad = data_input.get(
        "descripcion_novedad",
        ""
    )
    respuesta_actual = data_input.get(
        "respuesta_actual",
        ""
    )

    # Texto utilizado únicamente para buscar
    # históricos con similitud al caso actual.
    texto_consulta = (
        f"{descripcion_novedad} {respuesta_actual}"
    )

    historicos_seleccionados = (
        recuperar_y_rankear_historicos(
            indicador=indicador,
            cd=cd,
            texto_consulta=texto_consulta,
            max_resultados=4
        )
    )

    # Solo los históricos seleccionados se envían
    # como contexto al proveedor de IA.
    payload_ia = {
        "cd": cd,
        "indicador": indicador,
        "descripcion_novedad": descripcion_novedad,
        "nivel": data_input.get("nivel"),
        "respuesta_actual": respuesta_actual,
        "respuestas_anteriores": data_input.get(
            "respuestas_anteriores",
            []
        ),
        "transporte": data_input.get("transporte"),
        "placa": data_input.get("placa"),
        "historicos": historicos_seleccionados
    }

    return evaluar_causa_raiz_con_ia(
        payload_ia
    )