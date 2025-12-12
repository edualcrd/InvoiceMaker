const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    numero: { type: String, required: true },
    fecha: { type: Date, required: true },
    vencimiento: Date,
    cliente: Object,
    items: Array,
    baseImponible: Number,
    
    // --- AÑADE ESTO ---
    tipoIva: { type: Number, default: 21 }, // Guardamos el % (ej: 21)
    // ------------------
    
    total: Number,
    pagada: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);