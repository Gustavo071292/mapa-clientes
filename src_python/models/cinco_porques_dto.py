from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class CincoPorquesRequest(BaseModel):
    cd: str = Field(
        ...,
        min_length=1,
        description="Centro de Distribución obligatorio"
    )
    indicador: str = Field(
        ...,
        min_length=1,
        description="Indicador operativo obligatorio"
    )
    descripcion_novedad: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Descripción principal de la novedad"
    )
    nivel: int = Field(
        ...,
        ge=1,
        le=5,
        description="Nivel actual del porqué (1 a 5)"
    )
    respuesta_actual: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="Respuesta dada por el operador en este nivel"
    )
    transporte: Optional[str] = Field(
        None,
        max_length=50,
        description="Número de transporte SAP opcional"
    )
    placa: Optional[str] = Field(
        None,
        max_length=20,
        description="Placa del vehículo opcional"
    )
    respuestas_anteriores: Optional[List[str]] = Field(
        default_factory=list,
        description="Cadena de respuestas previas"
    )


class CincoPorquesResponse(BaseModel):
    ia_disponible: bool = Field(
        ...,
        description="Indica si Gemini respondió correctamente"
    )
    estado: Optional[
        Literal[
            "respuesta_suficientemente_causal",
            "necesita_profundizar",
            "respuesta_demasiado_general",
            "requiere_aclaracion",
            "posible_causa_raiz"
        ]
    ] = Field(
        None,
        description="Estado normalizado de la evaluación"
    )
    evaluacion: Optional[str] = Field(
        None,
        description="Evaluación breve y comprensible para el operador"
    )
    pregunta_siguiente: Optional[str] = Field(
        None,
        description="Siguiente pregunta operativa corta"
    )
    opciones: List[str] = Field(
        default_factory=list,
        description="Lista corta de opciones sugeridas"
    )
    historicos_utilizados: int = Field(
        0,
        ge=0,
        description="Cantidad de históricos incluidos en el contexto"
    )
    requiere_aclaracion: bool = Field(
        False,
        description="True si la respuesta requiere aclaración antes de continuar"
    )
    mensaje: Optional[str] = Field(
        None,
        description="Mensaje técnico controlado o de indisponibilidad"
    )


class GeminiAIOutputDTO(BaseModel):
    estado: Literal[
        "respuesta_suficientemente_causal",
        "necesita_profundizar",
        "respuesta_demasiado_general",
        "requiere_aclaracion",
        "posible_causa_raiz"
    ]
    evaluacion: str = Field(..., min_length=1)
    pregunta_siguiente: Optional[str] = None
    opciones: List[str] = Field(default_factory=list)
    requiere_aclaracion: bool