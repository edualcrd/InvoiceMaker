// frontend/src/pages/RegisterPage.jsx
import { useState } from 'react';
import { toast } from 'sonner';

function RegisterPage({ onSwitchToLogin }) {
  const [form, setForm] = useState({ email: '', password: '', nombreEmpresa: '' });
  const [loading, setLoading] = useState(false); // Para evitar doble clic

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Bloqueamos el botón
    console.log("Intentando registrar:", form); // VER EN CONSOLA

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      // Intentamos leer la respuesta del servidor
      const data = await res.json();
      console.log("Respuesta servidor:", data);

      if (res.ok) {
        toast.success('¡Cuenta creada con éxito!');
        onSwitchToLogin(); // Cambiamos al Login
      } else {
        // Si el servidor dice que hay error (ej: email repetido)
        toast.error(data.error || 'Error al registrarse');
      }
    } catch (error) {
      // Si el servidor está apagado o falla la red
      console.error("Error de conexión:", error);
      toast.error('Error de conexión. ¿Está el servidor encendido?');
    } finally {
      setLoading(false); // Desbloqueamos el botón
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B', color: 'white' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: '#18181B', borderRadius: '12px', border: '1px solid #27272A', textAlign: 'center' }}>
        
        <h1 style={{ marginBottom: '10px', fontSize: '2rem' }}>Crear Cuenta</h1>
        <p style={{ color: '#71717A', marginBottom: '30px' }}>Empieza a gestionar tu negocio hoy.</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>NOMBRE EMPRESA</label>
            <input 
              type="text" 
              placeholder="Ej: Mi Negocio S.L." 
              value={form.nombreEmpresa} 
              onChange={e => setForm({...form, nombreEmpresa: e.target.value})} 
              required 
              style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>EMAIL</label>
            <input 
              type="email" 
              placeholder="hola@ejemplo.com" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
              style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>CONTRASEÑA</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              required 
              style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px', width: '100%', padding: '15px', 
              background: loading ? '#555' : 'white', 
              color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: loading ? 'wait' : 'pointer' 
            }}
          >
            {loading ? 'CREANDO CUENTA...' : 'REGISTRARSE'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#A1A1AA' }}>
          ¿Ya tienes cuenta? <button onClick={onSwitchToLogin} style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer', fontWeight: 'bold' }}>Inicia Sesión</button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;