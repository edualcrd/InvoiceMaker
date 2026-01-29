import { useState } from 'react';
import { toast } from 'sonner';

// Recibimos onLogin (para entrar) y onSwitchToRegister (para ir a crear cuenta)
function LoginPage({ onLogin, onSwitchToRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Petición al servidor real
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        // 2. Guardamos el TOKEN
        localStorage.setItem('invoice_token', data.token);
        
        // Guardamos también los datos de empresa si los hay
        if (data.nombreEmpresa) {
           const currentProfile = JSON.parse(localStorage.getItem('invoiceMaker_profile') || '{}');
           localStorage.setItem('invoiceMaker_profile', JSON.stringify({ ...currentProfile, nombre: data.nombreEmpresa }));
        }

        toast.success('¡Bienvenido de nuevo!');
        onLogin(); // Avisamos a App.jsx para que quite el candado
      } else {
        toast.error(data.error || 'Contraseña incorrecta');
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B', color: 'white' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: '#18181B', borderRadius: '12px', border: '1px solid #27272A', textAlign: 'center' }}>
        
        <h1 style={{ marginBottom: '10px', fontSize: '2.5rem' }}>
          InvoiceMaker
        </h1>
        <p style={{ color: '#71717A', marginBottom: '40px' }}>Inicia sesión para gestionar tu negocio</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>EMAIL</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} autoFocus required style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>CONTRASEÑA</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
          </div>

          <button type="submit" style={{ marginTop: '10px', width: '100%', padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            ENTRAR
          </button>
        </form>

        {/* ENLACE PARA IR A REGISTRO */}
        <p style={{ marginTop: '30px', fontSize: '0.9rem', color: '#A1A1AA' }}>
          ¿No tienes cuenta? <button onClick={onSwitchToRegister} style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer', fontWeight: 'bold' }}>Regístrate gratis</button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;