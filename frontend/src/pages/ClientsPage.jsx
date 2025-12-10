// frontend/src/pages/ClientsPage.jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../api';
function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nombre: '', nif: '', email: '', direccion: '' });
  const [editingId, setEditingId] = useState(null); // Si es null, estamos creando. Si tiene ID, estamos editando.

  // Cargar clientes al entrar
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const res = await authFetch('http://localhost:3000/api/clients');
    const data = await res.json();
    setClients(data);
  };

  const handleDelete = async (id) => {
    toast.error('¿Borrar este cliente?', {
      action: {
      label: 'Confirmar',
      onClick: async () => {
        await fetch(`http://localhost:3000/api/clients/${id}`, { method: 'DELETE' });
        cargarClientes();
        toast.success('Cliente eliminado');
      }
      }
    });
    return;
    await fetch(`http://localhost:3000/api/clients/${id}`, { method: 'DELETE' });
    cargarClientes(); // Recargar la lista
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      // MODO ACTUALIZAR (PUT)
      await fetch(`http://localhost:3000/api/clients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setEditingId(null); // Salir del modo edición
    } else {
      // MODO CREAR (POST)
      await fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    }

    setForm({ nombre: '', nif: '', email: '', direccion: '' }); // Limpiar
    cargarClientes(); // Recargar lista
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  // Cargar datos en el formulario para editar
  const handleEdit = (cliente) => {
    setForm(cliente); // Rellena los inputs con los datos del cliente
    setEditingId(cliente._id); // Activamos el modo "Edición"
  };
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* CABECERA */}
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

        {/* IZQUIERDA: FORMULARIO DE ALTA */}
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

            {/* Botón extra para cancelar edición si te arrepientes */}
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

        {/* DERECHA: TABLA DE DATOS */}
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

                    <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(client)}
                        style={{ background: 'transparent', border: '1px solid #EAB308', color: '#EAB308', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
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