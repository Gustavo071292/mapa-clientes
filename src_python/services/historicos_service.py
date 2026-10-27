import re
from typing import List, Dict, Any
from config.db import db


SPANISH_STOP_WORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o",
    "de", "del", "a", "en", "por", "para", "con", "sin", "sobre",
    "entre", "al", "lo", "su", "sus", "que", "se", "no", "si", "ya",
    "fue", "es", "son", "está", "están", "como", "más", "pero",
    "este", "esta", "estos", "estas", "le", "les"
}


def tokenizar_texto(texto: str) -> set:
    if not texto:
        return set()

    palabras = re.findall(r"\b[a-záéíóúñ]+\b", texto.lower())

    return {
        palabra
        for palabra in palabras
        if palabra not in SPANISH_STOP_WORDS and len(palabra) > 2
    }


def calcular_similitud_jaccard(
    tokens_actuales: set,
    texto_historico: str
) -> float:

    tokens_historico = tokenizar_texto(texto_historico)

    if not tokens_actuales or not tokens_historico:
        return 0.0

    interseccion = tokens_actuales.intersection(tokens_historico)
    union = tokens_actuales.union(tokens_historico)

    return len(interseccion) / len(union) if union else 0.0


def recuperar_y_rankear_historicos(
    indicador: str,
    cd: str,
    texto_consulta: str,
    max_resultados: int = 4
) -> List[Dict[str, Any]]:

    if db is None:
        return []

    coleccion = db["cinco_porques"]

    proyeccion = {
        "_id": 1,
        "descripcion_novedad": 1,
        "p1": 1,
        "p2": 1,
        "p3": 1,
        "p4": 1,
        "p5": 1,
        "causa_raiz": 1,
        "plan_accion": 1
    }

    candidatos_dict = {}

    try:
        # Primera búsqueda: mismo indicador + mismo CD.
        cursor_cd = (
            coleccion
            .find(
                {"indicador": indicador, "cd": cd},
                proyeccion
            )
            .sort("fecha_creacion", -1)
            .limit(15)
        )

        for documento in cursor_cd:
            documento_id = str(documento.get("_id"))
            candidatos_dict[documento_id] = documento

        # Si hay pocos casos del CD, ampliar al mismo indicador
        # independientemente del centro de distribución.
        if len(candidatos_dict) < 5:
            cursor_general = (
                coleccion
                .find(
                    {"indicador": indicador},
                    proyeccion
                )
                .sort("fecha_creacion", -1)
                .limit(20)
            )

            for documento in cursor_general:
                documento_id = str(documento.get("_id"))

                if documento_id not in candidatos_dict:
                    candidatos_dict[documento_id] = documento

        candidatos = list(candidatos_dict.values())

        if not candidatos:
            return []

        tokens_actuales = tokenizar_texto(texto_consulta)
        candidatos_puntuados = []

        for candidato in candidatos:
            texto_historico = " ".join([
                str(candidato.get("descripcion_novedad", "")),
                str(candidato.get("p1", "")),
                str(candidato.get("p2", "")),
                str(candidato.get("p3", "")),
                str(candidato.get("p4", "")),
                str(candidato.get("p5", "")),
                str(candidato.get("causa_raiz", "")),
                str(candidato.get("plan_accion", ""))
            ])

            score = calcular_similitud_jaccard(
                tokens_actuales,
                texto_historico
            )

            if score > 0.0:
                candidatos_puntuados.append(
                    (score, candidato)
                )

        candidatos_puntuados.sort(
            key=lambda item: item[0],
            reverse=True
        )

        historicos_seleccionados = []

        for _, candidato in candidatos_puntuados[:max_resultados]:
            historico_limpio = dict(candidato)

            # _id se utiliza únicamente para deduplicar.
            # Nunca debe enviarse al proveedor de IA.
            historico_limpio.pop("_id", None)

            historicos_seleccionados.append(
                historico_limpio
            )

        return historicos_seleccionados

    except Exception as error:
        print(
            "[Error] Fallo en la recuperación "
            f"de históricos read-only: {str(error)}"
        )

        return []