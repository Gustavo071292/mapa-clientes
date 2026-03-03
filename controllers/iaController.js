const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generarSugerencia = async (req, res) => {
    const { nivelPorqué, contextoOriginal } = req.body;
    
    // Tu contingencia Pro impecable
    const contingencia = {
        1: ["Falla en proceso de despacho en CD", "Error de comunicación con el cliente/T2", "Problema mecánico o de transporte"],
        2: ["Falta de capacitación del personal nuevo", "Herramienta digital lenta", "Incumplimiento de ventana pactada"],
        3: ["Desviación del estándar operativo DPO", "Falta de supervisión activa", "Error en la planeación de la ruta"],
        4: ["Carencia de herramientas adecuadas", "Proceso DPO no actualizado", "Falla en mantenimiento preventivo"],
        5: ["Causa Raíz: Reentrenamiento crítico en estándar DPO", "Causa Raíz: Ajuste necesario en ventanas de servicio", "Causa Raíz: Inversión tecnológica"]
    };

    try {
        // CAMBIO CLAVE: Sin 'latest' y sin configuraciones extra que dupliquen barras
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Actúa como experto DPO Bavaria. Contexto: ${contextoOriginal}. Nivel: ${nivelPorqué}. Sugiere 3 opciones en JSON simple: ["A", "B", "C"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const opciones = JSON.parse(text.replace(/```json|```/g, "").trim());
        
        res.status(200).json({ exito: true, opciones });

    } catch (error) {
        console.error("⚠️ Usando Contingencia:", error.message);
        res.status(200).json({ 
            exito: true, 
            opciones: contingencia[nivelPorqué] || ["Revisar manual"] 
        });
    }
};