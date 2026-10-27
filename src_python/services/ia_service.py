import os
import json
from typing import Dict, Any
from google import genai
from dotenv import load_dotenv
from models.cinco_porques_dto import GeminiAIOutputDTO

dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
try:
    GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "15.0"))
except ValueError:
    GEMINI_TIMEOUT_SECONDS = 15.0

client = None
if GEMINI_API_KEY:
    try:
        timeout_ms = int(GEMINI_TIMEOUT_SECONDS * 1000)
        client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options={"timeout": timeout_ms}
        )
    except Exception as e:
        print(f"[Aviso] No se pudo inicializar el cliente Gemini: {e}")

def validar_invariantes_semanticas(validated_ia: GeminiAIOutputDTO) -> None:
    """
    Funciona estrictamente como un validador ASSERT de invariantes estructurales/semánticas.
    NUNCA inventa, modifica o fabrica contenido analítico. Ante una contradicción, 
    lanza ValueError para activar el fallback controlado.
    """
    estado = validated_ia.estado
    p_siguiente = validated_ia.pregunta_siguiente
    req_aclaracion = validated_ia.requiere_aclaracion

    # Invariante 1: necesita_profundizar -> DEBE tener pregunta_siguiente no vacía
    if estado == "necesita_profundizar":
        if not p_siguiente or not p_siguiente.strip():
            raise ValueError("Invariante violada: 'necesita_profundizar' requiere una pregunta_siguiente válida.")

    # Invariante 2: requiere_aclaracion -> requiere_aclaracion=true y pregunta_siguiente obligatoria
    if estado == "requiere_aclaracion":
        if not req_aclaracion:
            raise ValueError("Invariante violada: 'requiere_aclaracion' exige que requiere_aclaracion sea true.")
        if not p_siguiente or not p_siguiente.strip():
            raise ValueError("Invariante violada: 'requiere_aclaracion' requiere una pregunta_siguiente válida.")

    # Invariante 3: estado != requiere_aclaracion -> requiere_aclaracion debe ser false
    if estado != "requiere_aclaracion" and req_aclaracion:
        raise ValueError("Invariante violada: requiere_aclaracion no puede ser true si el estado es diferente.")

    # Invariante 4: posible_causa_raiz -> pregunta_siguiente debe ser null
    if estado == "posible_causa_raiz" and p_siguiente is not None:
        raise ValueError("Invariante violada: 'posible_causa_raiz' no debe tener pregunta_siguiente.")

    # Invariante 5: respuesta_suficientemente_causal -> en esta V1 se exige pregunta_siguiente == null
    if estado == "respuesta_suficientemente_causal" and p_siguiente is not None:
        raise ValueError("Invariante violada: 'respuesta_suficientemente_causal' no debe traer pregunta_siguiente.")


def evaluar_causa_raiz_con_ia(prompt_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comunica con Gemini aplicando timeout real, validación estricta Pydantic,
    validación estricta de invariantes (ASSERT) y fallback controlado.
    """
    fallback_response = {
        "ia_disponible": False,
        "estado": None,
        "evaluacion": None,
        "pregunta_siguiente": None,
        "opciones": [],
        "historicos_utilizados": 0,
        "requiere_aclaracion": False,
        "mensaje": "El asistente de IA se encuentra temporalmente indisponible. El análisis puede continuar de forma manual."
    }

    if not client or not GEMINI_API_KEY:
        print("[Log Servidor] GEMINI_API_KEY ausente o cliente inactivo.")
        return fallback_response

    system_instruction = (
        "Eres un experto analista operativo de la metodología 5 Porqués y DPO en logística. "
        "Ayuda a operadores de baja familiaridad digital a profundizar en causas raíz de incidentes operativos. "
        "REGLAS DE ESTADOS SEMÁNTICOS OBLIGATORIAS:\n"
        "1. 'respuesta_demasiado_general': La respuesta es vaga, genérica o superficial ('por operación', 'por demora').\n"
        "2. 'requiere_aclaracion': La respuesta es ambigua, contradictoria o falta información. requiere_aclaracion=true y requiere pregunta_siguiente solicitando aclaración.\n"
        "3. 'necesita_profundizar': La respuesta aporta una causa intermedia concreta, pero debemos seguir preguntando el origen. Obligatoriamente DEBE incluir una 'pregunta_siguiente' válida.\n"
        "4. 'respuesta_suficientemente_causal': Explicación causal sólida del nivel actual que NO requiere otra pregunta causal inmediata. pregunta_siguiente debe ser null.\n"
        "5. 'posible_causa_raiz': Posible origen fundamental/accionable de la cadena, pendiente de confirmación humana. pregunta_siguiente debe ser null.\n\n"
        "DIRECTRICES GENERALES:\n"
        "- No forzar cinco niveles artificialmente. El nivel 5 no significa automáticamente causa raíz; una posible causa raíz puede aparecer antes.\n"
        "- Las opciones deben ser hipótesis o caminos de investigación para el operador, no hechos afirmados como verdaderos.\n"
        "- Los históricos son únicamente contexto; nunca asumas que una causa histórica es la actual.\n"
        "- Mantén lenguaje operativo, corto y comprensible para personal de logística.\n"
        "- Responde ESTRICTAMENTE en formato JSON válido."
    )

    transporte_info = f"\n- Transporte: {prompt_payload.get('transporte')}" if prompt_payload.get('transporte') else ""
    placa_info = f"\n- Placa: {prompt_payload.get('placa')}" if prompt_payload.get('placa') else ""

    user_prompt = f"""
Analiza la siguiente respuesta en la cadena de causa raíz para el indicador '{prompt_payload.get('indicador')}' en el CD '{prompt_payload.get('cd')}':
- Descripción de Novedad: {prompt_payload.get('descripcion_novedad')}{transporte_info}{placa_info}
- Nivel actual: {prompt_payload.get('nivel')}
- Respuestas anteriores: {prompt_payload.get('respuestas_anteriores', [])}
- Respuesta actual del operador: {prompt_payload.get('respuesta_actual')}

Históricos pertinentes (referencia contextual sin _id):
{json.dumps(prompt_payload.get('historicos', []), ensure_ascii=False)}

Devuelve un JSON con:
- estado: uno de ["respuesta_suficientemente_causal", "necesita_profundizar", "respuesta_demasiado_general", "requiere_aclaracion", "posible_causa_raiz"]
- evaluacion: texto breve evaluando la respuesta actual (coherente con el estado)
- pregunta_siguiente: pregunta operativa corta o null (obligatoria si estado es necesita_profundizar o requiere_aclaracion; null estrictamente si es respuesta_suficientemente_causal o posible_causa_raiz)
- opciones: lista de 2 a 4 opciones o hipótesis prácticas (o [])
- requiere_aclaracion: boolean
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=user_prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "temperature": 0.2,
            }
        )

        if not response or not response.text:
            return fallback_response

        raw_data = json.loads(response.text)

        # 1. Validación estructural estricta con Pydantic
        validated_ia = GeminiAIOutputDTO(**raw_data)

        # 2. Validación estricta de invariantes semánticas (ASSERT)
        validar_invariantes_semanticas(validated_ia)

        resultado = {
            "ia_disponible": True,
            "estado": validated_ia.estado,
            "evaluacion": validated_ia.evaluacion,
            "pregunta_siguiente": validated_ia.pregunta_siguiente,
            "opciones": validated_ia.opciones,
            "historicos_utilizados": len(prompt_payload.get("historicos", [])),
            "requiere_aclaracion": validated_ia.requiere_aclaracion,
            "mensaje": None
        }
        return resultado

    except Exception as e:
        print(f"[Log Servidor - Error IA/Timeout/Invariante]: {str(e)}")
        return fallback_response