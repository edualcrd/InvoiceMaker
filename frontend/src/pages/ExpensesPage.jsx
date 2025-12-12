import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../api';

const CATEGORIAS = [
    'General',
    'Oficina / Material',
    'Suscripciones / Software',
    'Marketing / Publicidad',
    'Impuestos',
    'Sueldos / Colaboradores',
    'Alquiler / Suministros'
];

function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        proveedor: '',
        concepto: '',
        importe: '',
        categoria: 'General' // <--- Valor por defecto
    });

    useEffect(() => { cargarGastos(); }, []);

    const cargarGastos = async () => {
        const res = await authFetch('http://localhost:3000/api/expenses');
        if (res.ok) setExpenses(await res.json());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. VALIDACIÓN PREVIA (Ahora comprobamos también el concepto)
        if (!form.importe || !form.proveedor || !form.concepto) {
            return toast.error('Rellena todos los campos: Proveedor, Concepto e Importe');
        }

        try {
            // 2. PETICIÓN AL SERVIDOR
            const res = await authFetch('http://localhost:3000/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            // 3. VERIFICACIÓN REAL
            if (res.ok) {
                toast.success('Gasto registrado correctamente');
                // Limpiamos el formulario pero mantenemos la fecha de hoy
                setForm({ ...form, proveedor: '', concepto: '', importe: '', categoria: 'General' });
                cargarGastos(); // Recargamos la lista
            } else {
                // Si el servidor dice que no (ej: error de base de datos), mostramos error
                const errorData = await res.json();
                toast.error(errorData.error || 'Error al guardar. Inténtalo de nuevo.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error de conexión con el servidor');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Borrar este gasto?')) return;
        await authFetch(`http://localhost:3000/api/expenses/${id}`, { method: 'DELETE' });
        cargarGastos();
        toast.success('Eliminado');
    };

    const totalGastos = expenses.reduce((acc, curr) => acc + curr.importe, 0);

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Gastos</h1>
                <div style={{ background: '#27272A', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333' }}>
                    Total: <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '1.2rem' }}>-{totalGastos.toFixed(2)}€</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                {/* FORMULARIO */}
                <div style={{ flex: 1, background: '#18181B', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginTop: 0 }}>Nuevo Gasto</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} />

                        {/* SELECTOR DE CATEGORÍA */}
                        <select
                            value={form.categoria}
                            onChange={e => setForm({ ...form, categoria: e.target.value })}
                            style={inputStyle}
                        >
                            {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>

                        <input placeholder="Proveedor (Ej: Amazon)" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} style={inputStyle} />
                        <input placeholder="Concepto" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} style={inputStyle} />
                        <input type="number" placeholder="Importe (€)" value={form.importe} onChange={e => setForm({ ...form, importe: e.target.value })} style={inputStyle} />
                        <button type="submit" style={{ padding: '12px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>AÑADIR</button>
                    </form>
                </div>

                {/* LISTA CON ETIQUETAS */}
                <div style={{ flex: 2 }}>
                    {expenses.map(gasto => (
                        <div key={gasto._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18181B', border: '1px solid #27272A', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{gasto.proveedor}</span>
                                    {/* ETIQUETA DE CATEGORÍA */}
                                    <span style={{ fontSize: '0.7rem', background: '#3F3F46', padding: '2px 6px', borderRadius: '4px', color: '#E4E4E7' }}>
                                        {gasto.categoria || 'General'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#71717A' }}>{new Date(gasto.fecha).toLocaleDateString()} - {gasto.concepto}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ color: '#EF4444', fontWeight: 'bold' }}>-{gasto.importe.toFixed(2)}€</span>
                                <button onClick={() => handleDelete(gasto._id)} style={{ background: 'transparent', border: 'none', color: '#52525B', cursor: 'pointer' }}>✕</button>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && <p style={{ textAlign: 'center', color: '#555' }}>No hay gastos.</p>}
                </div>
            </div>
        </div>
    );
}

const inputStyle = { padding: '10px', background: '#09090B', border: '1px solid #333', color: 'white', borderRadius: '4px' };

export default ExpensesPage;