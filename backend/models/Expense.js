const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fecha: { type: Date, required: true },
    proveedor: { type: String, required: true }, // Ej: "Amazon", "Vodafone"
    concepto: { type: String, required: true },  // Ej: "Servidor Web", "Material Oficina"
    importe: { type: Number, required: true },   // Ej: 50.00
    categoria: { type: String, default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);