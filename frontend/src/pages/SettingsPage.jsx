import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../api';

function SettingsPage() {
  const [profile, setProfile] = useState({
    nombreEmpresa: '',
    nif: '',
    direccion: '',
    contactEmail: '',
    iban: '',
    logo: ''
  });

  // 1. Cargar datos de la NUBE al entrar
  useEffect(() => {
    authFetch('http://localhost:3000/api/user/profile')
      .then(res => res.json())
      .then(data => {
         // Si el usuario existe, rellenamos el estado
         if (data) setProfile(data);
      })
      .catch(err => console.error(err));
  }, []);

  // 2. Guardar datos en la NUBE
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        toast.success('¡Datos guardados en tu cuenta!');
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  // Procesador de imagen (igual que antes)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) return alert('Máximo 500KB para el logo.'); // Bajamos un poco el límite para no saturar Mongo

    const reader = new FileReader();
    reader.onloadend = () => setProfile({ ...profile, logo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Configuración</h1>
      <p style={{ color: '#71717A', marginBottom: '40px' }}>Datos de la empresa</p>

      <div style={{ background: '#18181B', padding: '30px', borderRadius: '12px', border: '1px solid #27272A', color: 'white' }}>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ZONA DE LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #333', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.logo ? <img src={profile.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '2rem' }}>🏢</span>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Logotipo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} id="logoInput" style={{ display: 'none' }} />
              <label htmlFor="logoInput" style={{ display: 'inline-block', padding: '8px 12px', background: '#27272A', color: 'white', borderRadius: '6px', cursor: 'pointer', border: '1px solid #333', fontSize: '0.8rem' }}>Subir Imagen</label>
              {profile.logo && <button type="button" onClick={() => setProfile({ ...profile, logo: '' })} style={{ marginLeft: '10px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Eliminar</button>}
            </div>
          </div>

          {/* CAMPOS DE TEXTO */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nombre / Razón Social</label>
              <input name="nombreEmpresa" value={profile.nombreEmpresa || ''} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>NIF / CIF</label>
              <input name="nif" value={profile.nif || ''} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dirección Completa</label>
            <input name="direccion" value={profile.direccion || ''} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Email Público</label>
              <input name="contactEmail" value={profile.contactEmail || ''} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>IBAN</label>
              <input name="iban" value={profile.iban || ''} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <button type="submit" style={{ marginTop: '10px', padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            GUARDAR PERFIL
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#A1A1AA' };
const inputStyle = { width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' };

export default SettingsPage;