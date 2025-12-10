import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../api';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nombre: '', nif: '', email: '', direccion: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      
      const res = await authFetch('http://localhost:3000/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error cargando clientes", error);
    }
  };

  const handleDelete = async (id) => {
    // Usamos authFetch en lugar de fetch
    if (!confirm('¿Seguro que quieres borrar este cliente?')) return;

    const res = await authFetch(`http://localhost:3000/api/clients/${id}`, { method: 'DELETE' });
    
    if (res.ok) {
      toast.success('Cliente eliminado');
      cargarClientes();
    } else {
      toast.error('Error al eliminar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let res;
    const options = {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form)
    };

    if (editingId) {
      res = await authFetch(`http://localhost:3000/api/clients/${editingId}`, options);
    } else {
      res = await authFetch('http://localhost:3000/api/clients', options);
    }

    if (res.ok) {
        setForm({ nombre: '', nif: '', email: '', direccion: '' });
        setEditingId(null);
        cargarClientes();
        toast.success(editingId ? 'Cliente actualizado' : 'Cliente creado');
    } else {
        toast.error('Error al guardar');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = (cliente) => {
    setForm(cliente);
    setEditingId(cliente._id);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
    
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Cartera de Clientes</h1>
          <p style={{ color: '#71717A' }}>Gestiona tus contactos comerciales</p>
        </div>
        <div style={{ background: '#09090B', color: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333' }}>
          Total: <strong style={{ color: '#10B981' }}>{clients.length}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {/* IZQUIERDA: FORMULARIO */}
        <div style={{ flex: 1, background: '#18181B', padding: '25px', borderRadius: '12px', border: '1px solid #27272A', color: 'white' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A1A1AA', display: 'block', marginBottom: '5px' }}>NOMBRE FISCAL *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A1A1AA', display: 'block', marginBottom: '5px' }}>NIF / CIF *</label>
              <input name="nif" value={form.nif} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A1A1AA', display: 'block', marginBottom: '5px' }}>EMAIL CONTACTO</label>
              <input name="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A1A1AA', display: 'block', marginBottom: '5px' }}>DIRECCIÓN</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
            </div>
            <button type="submit" style={{ marginTop: '10px', padding: '12px', background: editingId ? '#EAB308' : 'white', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              {editingId ? 'GUARDAR CAMBIOS' : '+ AÑADIR CLIENTE'}
            </button>
             {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ nombre: '', nif: '', email: '', direccion: '' }); }}
                style={{ marginTop: '10px', padding: '10px', background: 'transparent', color: '#A1A1AA', border: '1px solid #333', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>

        {/* DERECHA: TABLA */}
        <div style={{ flex: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E4E4E7', textAlign: 'left' }}>
                <th style={{ padding: '10px', color: '#71717A' }}>EMPRESA</th>
                <th style={{ padding: '10px', color: '#71717A' }}>ID FISCAL</th>
                <th style={{ padding: '10px', color: '#71717A' }}>CONTACTO</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client._id} style={{ borderBottom: '1px solid #E4E4E7' }}>
                  <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{client.nombre}</td>
                  <td className="mono" style={{ padding: '10px' }}>{client.nif}</td>
                  <td style={{ padding: '10px', color: '#71717A' }}>{client.email || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button onClick={() => handleEdit(client)} style={{ marginRight: '10px', background: 'transparent', border: '1px solid #EAB308', color: '#EAB308', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                      <button onClick={() => handleDelete(client._id)} style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && <p style={{ textAlign: 'center', color: '#A1A1AA', marginTop: '40px' }}>No hay clientes registrados.</p>}
        </div>
      </div>
    </div>
  );
}

export default ClientsPage;