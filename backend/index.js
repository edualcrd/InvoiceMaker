// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const auth = require('./middleware/auth'); // <--- IMPORTANTE
// CLAVE SECRETA PARA LOS TOKENS (En un proyecto real esto va en .env)
const JWT_SECRET = 'tokenSecreto-invoicemaker';

// Importamos el modelo que acabamos de crear en el Paso 1
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');
const Product = require('./models/Product');
const app = express();

// Middlewares (Configuración básica)
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A BASE DE DATOS ---

const MONGO_URI = 'mongodb+srv://edualcrd:Laude_178@invoicemaker-db.bocdkvy.mongodb.net/?appName=InvoiceMaker-DB';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Conectada'))
    .catch((err) => console.error('❌ Error de Mongo:', err));

// --- RUTAS DE AUTENTICACIÓN (NUEVAS) ---

// 1. REGISTRO (Sign Up)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, nombreEmpresa } = req.body;

        // Comprobar si ya existe
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ error: 'Ese email ya está registrado' });

        // Encriptar contraseña (La convertimos en hash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const nuevoUsuario = new User({
            email,
            password: hashedPassword,
            nombreEmpresa
        });
        await nuevoUsuario.save();

        res.status(201).json({ mensaje: 'Usuario creado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar' });
    }
});

// 2. LOGIN (Sign In)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await User.findOne({ email });
        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });

        // Comprobar contraseña (compara la que escribes con la encriptada)
        const valida = await bcrypt.compare(password, usuario.password);
        if (!valida) return res.status(400).json({ error: 'Contraseña incorrecta' });

        // Generar el TOKEN (El "DNI" que le damos para que navegue)
        const token = jwt.sign({ userId: usuario._id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, nombreEmpresa: usuario.nombreEmpresa });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});
// --- RUTAS DE CLIENTES ---

// 1. Ruta para GUARDAR un nuevo cliente (POST)

app.get('/api/clients', auth, async (req, res) => {
    // Solo busca los clientes DE ESTE USUARIO
    const clientes = await Client.find({ user: req.user });
    res.json(clientes);
});

app.post('/api/clients', auth, async (req, res) => {
    // Al guardar, le ponemos la etiqueta del usuario
    const nuevoCliente = new Client({ ...req.body, user: req.user });
    await nuevoCliente.save();
    res.json(nuevoCliente);
});

app.delete('/api/clients/:id', auth, async (req, res) => {
    // Solo borra si el ID coincide y ADEMÁS pertenece al usuario
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
// --- UTILIDADES ---

// CALCULAR SIGUIENTE NÚMERO DE FACTURA
app.get('/api/invoices/next-number', async (req, res) => {
    try {
        // 1. Buscamos la última factura creada (ordenada por fecha creación descendente)
        // Nota: Usamos el campo _id porque contiene la fecha de creación implícita (natural sort)
        const ultimaFactura = await Invoice.findOne().sort({ _id: -1 });

        if (!ultimaFactura) {
            // Si no hay ninguna, empezamos por la 001 de este año
            const year = new Date().getFullYear();
            return res.json({ next: `${year}-001` });
        }

        // 2. Si existe, separamos el año del número (ej: "2024-015" -> "2024" y "015")
        const partes = ultimaFactura.numero.split('-');

        if (partes.length === 2) {
            const numeroActual = parseInt(partes[1]); // "015" -> 15
            const siguienteNumero = numeroActual + 1; // 16

            // Convertimos de nuevo a texto rellenando con ceros (16 -> "016")
            const siguienteNumeroTexto = siguienteNumero.toString().padStart(3, '0');
            const year = partes[0];

            return res.json({ next: `${year}-${siguienteNumeroTexto}` });
        }

        // Si el formato era raro, devolvemos un fallback
        res.json({ next: `${new Date().getFullYear()}-001` });

    } catch (error) {
        console.error(error);
        res.json({ next: 'ERROR' });
    }
});
// --- RUTAS DE FACTURAS ---
app.get('/api/invoices', auth, async (req, res) => {
    const facturas = await Invoice.find({ user: req.user });
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
    if(factura) {
        factura.pagada = !factura.pagada;
        await factura.save();
        res.json(factura);
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

// --- UTILIDAD: SIGUIENTE NÚMERO (POR USUARIO) ---
app.get('/api/invoices/next-number', auth, async (req, res) => {
    try {
        // Buscamos la última factura PERO SOLO DE ESTE USUARIO
        const ultimaFactura = await Invoice.findOne({ user: req.user }).sort({ _id: -1 });

        if (!ultimaFactura) {
            const year = new Date().getFullYear();
            return res.json({ next: `${year}-001` });
        }

        const partes = ultimaFactura.numero.split('-');
        if (partes.length === 2) {
            const numeroActual = parseInt(partes[1]);
            const siguienteNumero = (numeroActual + 1).toString().padStart(3, '0');
            return res.json({ next: `${partes[0]}-${siguienteNumero}` });
        }
        res.json({ next: `${new Date().getFullYear()}-001` });
    } catch (error) {
        res.json({ next: 'ERROR' });
    }
});
// --- RUTAS DE PRODUCTOS ---
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
// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});