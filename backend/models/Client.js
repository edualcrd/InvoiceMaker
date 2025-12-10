const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <--- DUEÑO
    nombre: { type: String, required: true },
    nif: { type: String, required: true },
    email: { type: String, required: true },
    direccion: { type: String, required: true },
    fechaAlta: { type: Date, default: Date.now },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Asume que tu modelo de usuario se llama 'User'
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);