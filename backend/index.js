const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forzamos DNS de Google

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importar modelos
const User = require('./models/User');
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');
const Product = require('./models/Product');
const Expense = require('./models/Expense');

// Importar middleware
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Conexión a MongoDB (Solo una vez) ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Conectada'))
    .catch((err) => console.error('❌ Error de Mongo:', err));

// ================= RUTAS DE AUTENTICACIÓN =================

// 1. Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, nombreEmpresa } = req.body;
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ error: 'Ese email ya está registrado' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = new User({ email, password: hashedPassword, nombreEmpresa });
        await nuevoUsuario.save();

        res.status(201).json({ mensaje: 'Usuario creado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar' });
    }
});

// 2. Login 
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await User.findOne({ email });
        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });

        const valida = await bcrypt.compare(password, usuario.password);
        if (!valida) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ userId: usuario._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, nombreEmpresa: usuario.nombreEmpresa });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ================= RUTAS DE CLIENTES =================

app.get('/api/clients', auth, async (req, res) => {
    try {
        const clientes = await Client.find({ user: req.user });
        res.json(clientes);
    } catch (error) { res.status(500).json({ error: 'Error al obtener clientes' }); }
});

app.post('/api/clients', auth, async (req, res) => {
    try {
        const nuevoCliente = new Client({ ...req.body, user: req.user });
        await nuevoCliente.save();
        res.json(nuevoCliente);
    } catch (error) { res.status(500).json({ error: 'Error al guardar cliente' }); }
});

app.delete('/api/clients/:id', auth, async (req, res) => {
    await Client.findOneAndDelete({ _id: req.params.id, user: req.user });
    res.json({ mensaje: 'Cliente eliminado' });
});

app.put('/api/clients/:id', auth, async (req, res) => {
    const clienteActualizado = await Client.findOneAndUpdate(
        { _id: req.params.id, user: req.user },
        req.body,
        { new: true }
    );
    res.json(clienteActualizado);
});

// ================= RUTAS DE FACTURAS =================

// 1. Calcular siguiente número (LÓGICA CORREGIDA)
app.get('/api/invoices/next-number', auth, async (req, res) => {
    try {
        const yearActual = new Date().getFullYear();
        
        // Buscamos la última factura de ESTE usuario
        const ultimaFactura = await Invoice.findOne({ user: req.user }).sort({ _id: -1 });

        if (!ultimaFactura) {
            return res.json({ next: `${yearActual}-001` });
        }

        const partes = ultimaFactura.numero.split('-'); // Ej: "2023-015"
        
        if (partes.length === 2) {
            const yearFactura = parseInt(partes[0]);
            let numeroActual = parseInt(partes[1]);

            // Si cambiamos de año (ej: ultima es 2023 pero estamos en 2024), reiniciamos contador
            if (yearFactura !== yearActual) {
                return res.json({ next: `${yearActual}-001` });
            }

            // Si es el mismo año, incrementamos
            const siguienteNumero = (numeroActual + 1).toString().padStart(3, '0');
            return res.json({ next: `${yearActual}-${siguienteNumero}` });
        }

        res.json({ next: `${yearActual}-001` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ next: 'ERROR' });
    }
});

app.get('/api/invoices', auth, async (req, res) => {
    const facturas = await Invoice.find({ user: req.user }).sort({ fecha: -1 });
    res.json(facturas);
});

app.post('/api/invoices', auth, async (req, res) => {
    const nuevaFactura = new Invoice({ ...req.body, user: req.user });
    await nuevaFactura.save();
    res.json(nuevaFactura);
});

app.delete('/api/invoices/:id', auth, async (req, res) => {
    await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user });
    res.json({ mensaje: 'Factura eliminada' });
});

app.patch('/api/invoices/:id', auth, async (req, res) => {
    const factura = await Invoice.findOne({ _id: req.params.id, user: req.user });
    if (factura) {
        factura.pagada = !factura.pagada;
        await factura.save();
        res.json(factura);
    } else {
        res.status(404).json({ error: 'Factura no encontrada' });
    }
});

app.put('/api/invoices/:id', auth, async (req, res) => {
    const actualizada = await Invoice.findOneAndUpdate(
        { _id: req.params.id, user: req.user },
        req.body,
        { new: true }
    );
    res.json(actualizada);
});

// ================= RUTAS DE PRODUCTOS =================

app.get('/api/products', auth, async (req, res) => {
    const productos = await Product.find({ user: req.user });
    res.json(productos);
});

app.post('/api/products', auth, async (req, res) => {
    const nuevo = new Product({ ...req.body, user: req.user });
    await nuevo.save();
    res.json(nuevo);
});

app.delete('/api/products/:id', auth, async (req, res) => {
    await Product.findOneAndDelete({ _id: req.params.id, user: req.user });
    res.json({ mensaje: 'Borrado' });
});

// ================= RUTAS DE GASTOS =================

app.get('/api/expenses', auth, async (req, res) => {
    const gastos = await Expense.find({ user: req.user }).sort({ fecha: -1 });
    res.json(gastos);
});

app.post('/api/expenses', auth, async (req, res) => {
    const nuevoGasto = new Expense({ ...req.body, user: req.user });
    await nuevoGasto.save();
    res.json(nuevoGasto);
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
    await Expense.findOneAndDelete({ _id: req.params.id, user: req.user });
    res.json({ mensaje: 'Gasto eliminado' });
});

// ================= PERFIL EMPRESA =================

app.get('/api/user/profile', auth, async (req, res) => {
    const usuario = await User.findById(req.user).select('-password');
    res.json(usuario);
});

app.put('/api/user/profile', auth, async (req, res) => {
    const usuarioActualizado = await User.findByIdAndUpdate(
        req.user,
        req.body,
        { new: true }
    ).select('-password');
    res.json(usuarioActualizado);
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});