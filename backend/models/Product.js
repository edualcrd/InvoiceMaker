const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <--- DUEÑO
    nombre: { type: String, required: true },
    precio: { type: Number, required: true }
});

module.exports = mongoose.model('Product', ProductSchema);