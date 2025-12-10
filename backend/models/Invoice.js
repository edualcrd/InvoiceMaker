const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <--- DUEÑO
    numero: { type: String, required: true }, // Quitamos unique global, porque dos usuarios pueden tener la factura "001"
    fecha: { type: Date, default: Date.now },
    vencimiento: Date,
    cliente: {
        nombre: String,
        nif: String,
        email: String,
        direccion: String
    },
    items: [{
        concepto: String,
        cantidad: Number,
        precio: Number
    }],
    baseImponible: Number,
    total: Number,
    pagada: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);