import { useState, useEffect } from 'react';
import { toast } from 'sonner';
function SettingsPage() {
  // Estado para tus datos
  const [profile, setProfile] = useState({
    nombre: '',
    nif: '',
    direccion: '',
    email: '',
    iban: ''
  });

  // 1. Cargamos los datos guardados al entrar
  useEffect(() => {
    const saved = localStorage.getItem('invoiceMaker_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  // 2. Guardamos datos
  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('invoiceMaker_profile', JSON.stringify(profile));
    toast.success('¡Datos de empresa guardados!');
  };

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  // Convertimos imagen a Base64 (Texto)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1000000) { // Límite 1MB
      return alert('El logo es demasiado grande. Usa una imagen más pequeña (max 1MB).');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Guardamos la imagen convertida en el estado
      setProfile({ ...profile, logo: reader.result });
    };
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Configuración</h1>
      <p style={{ color: '#71717A', marginBottom: '40px' }}>Estos datos aparecerán en el encabezado de tus facturas PDF.</p>

      <div style={{ background: '#18181B', padding: '30px', borderRadius: '12px', border: '1px solid #27272A', color: 'white' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>Mis Datos Fiscales</h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SUBIR LOGO */}
          {/* ZONA DE LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>

            {/* Previsualización del Logo */}
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #333',
              background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {profile.logo ? (
                <img src={profile.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem' }}></span>
              )}
            </div>

            {/* Input de archivo (oculto) y botón personalizado */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Logotipo de la Empresa</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                id="logoInput"
                style={{ display: 'none' }}
              />
              <label
                htmlFor="logoInput"
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  background: '#27272A',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  border: '1px solid #333'
                }}
              >
                Subir Imagen
              </label>

              {/* Botón para quitar logo si existe */}
              {profile.logo && (
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, logo: '' })}
                  style={{ marginLeft: '10px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#A1A1AA' }}>Nombre / Razón Social</label>
              <input name="nombre" value={profile.nombre} onChange={handleChange} placeholder="Ej: Eduardo Desarrollos S.L." style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#A1A1AA' }}>NIF / CIF</label>
              <input name="nif" value={profile.nif} onChange={handleChange} placeholder="Ej: B-12345678" style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#A1A1AA' }}>Dirección Completa</label>
            <input name="direccion" value={profile.direccion} onChange={handleChange} placeholder="Calle Ejemplo 123, Sevilla" style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#A1A1AA' }}>Email</label>
              <input name="email" value={profile.email} onChange={handleChange} placeholder="edu@empresa.com" style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#A1A1AA' }}>IBAN (Para recibir pagos)</label>
              <input name="iban" value={profile.iban} onChange={handleChange} placeholder="ES91 0000 0000..." style={{ width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px' }} />
            </div>
          </div>

          <button type="submit" style={{ marginTop: '10px', padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '6px' }}>
            GUARDAR CAMBIOS
          </button>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;