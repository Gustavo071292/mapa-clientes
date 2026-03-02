const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.obtenerSugerenciasCincoPorques = async (req, res) => {
    // Recibimos el historial para que la IA sepa qué se dijo antes
    const { textoEntrada, nivelPorqué, contextoOriginal, historialAnterior } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Actúa como experto DPO para Bavaria.
        NOVEDAD: "${contextoOriginal}"
        HISTORIAL DE ANÁLISIS: ${historialAnterior || "Iniciando"}
        NIVEL ACTUAL: Porqué # ${nivelPorqué}
        ÚLTIMA RESPUESTA SELECCIONADA: "${textoEntrada}"
        
        TAREA: Basado en la última respuesta, sugiere 3 opciones para el SIGUIENTE porqué. 
        Si estamos en el nivel 5, sugiere 3 "Causas Raíz" definitivas y una recomendación de acción.
        RESPUESTA: Solo un arreglo JSON. Ejemplo: ["Opción A", "Opción B", "Opción C"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const opciones = JSON.parse(text.replace(/```json|```/g, "").trim());

        res.status(200).json({ exito: true, opciones });

    } catch (error) {
        // Contingencia inteligente según el nivel
        const contingencia = {
            1: ["Falla en proceso de despacho", "Error de comunicación con cliente", "Problema de transporte"],
            2: ["Falta de capacitación del personal", "Herramienta digital lenta", "Incumplimiento de horario"],
            5: ["RECOMENDACIÓN: Reentrenamiento en estándar DPO", "RECOMENDACIÓN: Ajuste de ventanas de entrega", "RECOMENDACIÓN: Mantenimiento de equipos"]
        };
        
        res.status(200).json({ 
            exito: true, 
            opciones: contingencia[nivelPorqué] || ["Revisar manual de procesos", "Escalar a supervisor", "Ajustar planificación"]
        });
    }
};