const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nombreEmpresa: { type: String }, // Razón Social
    nif: { type: String },
    direccion: { type: String },
    contactEmail: { type: String }, // Email público de la empresa
    iban: { type: String },
    logo: { type: String } // Aquí guardaremos la imagen en Base64
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);