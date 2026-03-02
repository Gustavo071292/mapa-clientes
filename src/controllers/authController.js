// src/controllers/authController.js

exports.verificarAccesoVariable = (req, res) => {
    const { password } = req.body;
    
    // El código busca la variable definida en tu archivo .env
    const passwordCorrecta = process.env.VAR_PASSWORD; 

    if (password === passwordCorrecta) {
        // Acceso concedido a la sección confidencial
        return res.status(200).json({ 
            acceso: true, 
            mensaje: "Acceso concedido a la sección de variables" 
        });
    } else {
        // Acceso denegado
        return res.status(401).json({ 
            acceso: false, 
            mensaje: "Contraseña incorrecta. Solicítela al administrador." 
        });
    }
};