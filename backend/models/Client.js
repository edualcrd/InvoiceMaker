const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    // Usamos 'user' que es el que estás usando en tu index.js
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, 
    nombre: { type: String, required: true },
    nif: { type: String, required: true },
    email: { type: String, required: true },
    direccion: { type: String, required: true },
    fechaAlta: { type: Date, default: Date.now }
    // HE BORRADO EL CAMPO "usuario" QUE ESTABA DUPLICADO AQUÍ ABAJO
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);