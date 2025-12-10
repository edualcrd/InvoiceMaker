// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// CLAVE SECRETA (Debe ser la misma que en index.js)
const JWT_SECRET = 'mi_secreto_super_seguro_123';

module.exports = (req, res, next) => {
    // 1. Buscamos el token en la cabecera de la petición
    const token = req.header('x-auth-token');

    // 2. Si no hay token, fuera
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        // 3. Verificamos si el token es válido (no ha caducado, firma correcta)
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 4. Guardamos el ID del usuario en la petición para que las rutas lo usen
        req.user = decoded.userId;
        
        next(); // ¡Puede pasar!
    } catch (error) {
        res.status(401).json({ error: 'Token no válido' });
    }
};