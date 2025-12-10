// frontend/src/pages/ProductsPage.jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../api';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ nombre: '', precio: '' });

  useEffect(() => { cargarProductos(); }, []);

  const cargarProductos = async () => {
    const res = await authFetch('http://localhost:3000/api/products');
    if (res.ok) setProducts(await res.json());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) return toast.error('Rellena todos los campos');
    await authFetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    toast.success('Servicio guardado');
    setForm({ nombre: '', precio: '' });
    cargarProductos();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Borrar servicio?')) return;
    await authFetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
    toast.success('Servicio eliminado');
    cargarProductos();
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      overflowY: 'auto', 
      padding: '40px', // MÁS MARGEN GENERAL
      boxSizing: 'border-box'
    }}>
      
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'white' }}>
        Catálogo de Servicios
      </h1>
      <p style={{ color: '#A1A1AA', marginBottom: '40px' }}>Guarda tus precios habituales.</p>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* FORMULARIO */}
        <div style={{ flex: 1, minWidth: '300px', background: '#18181B', padding: '25px', borderRadius: '12px', border: '1px solid #27272A' }}>
          <h3 style={{ marginTop: 0, color: 'white', marginBottom: '20px' }}>Nuevo Servicio</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#71717A', display: 'block', marginBottom: '5px' }}>NOMBRE</label>
              <input type="text" placeholder="Ej: Diseño Web" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#71717A', display: 'block', marginBottom: '5px' }}>PRECIO (€)</label>
              <input type="number" placeholder="0.00" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ marginTop: '10px', padding: '12px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>GUARDAR</button>
          </form>
        </div>

        {/* LISTA DE PRODUCTOS - AJUSTADA PARA QUE NO SE CORTE */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#71717A' }}>
                <th style={{ padding: '10px', width: '50%' }}>CONCEPTO</th>
                <th style={{ padding: '10px', width: '25%' }}>PRECIO</th>
                {/* Alineamos a la derecha pero con padding extra para que no toque el borde */}
                <th style={{ padding: '10px 20px 10px 10px', width: '25%', textAlign: 'right' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid #27272A' }}>
                  <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{p.nombre}</td>
                  <td className="mono" style={{ padding: '10px', color: '#10B981' }}>{p.precio}€</td>
                  <td style={{ padding: '10px 20px 10px 10px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(p._id)} style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#52525B', border: '1px dashed #333', borderRadius: '8px', marginTop: '20px' }}>Lista vacía.</div>}
        </div>
      </div>
      {/* Espacio extra abajo para que no se corte al hacer scroll */}
      <div style={{ height: '100px' }}></div>
    </div>
  );
}

export default ProductsPage;