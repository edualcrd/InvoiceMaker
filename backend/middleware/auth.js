// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;;//Esta clave debe ser la misma que usamos al crear el token en el index.js

module.exports = (req, res, next) => {
    // 1. Buscamos el token en la cabecera de la petición
    const token = req.header('x-auth-token');

    // 2. Si no hay token, se niega el acceso
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        // 3. Verificamos si el token es válido usando la misma clave secreta
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Guardamos el ID del usuario en la petición
        req.user = decoded.userId;

        next(); // Con esta función pasamos al siguiente middleware o ruta
    } catch (error) {
        res.status(401).json({ error: 'Token no válido' });
    }
};