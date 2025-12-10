const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true // No puede haber dos usuarios con el mismo email
    },
    password: { 
        type: String, 
        required: true 
    },
    nombreEmpresa: String, // Guardamos aquí los datos de ajustes
    fechaRegistro: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', UserSchema);