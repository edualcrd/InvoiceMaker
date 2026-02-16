import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../api';

// --- Constantes ---
const API_URL = 'http://localhost:3000/api/user/profile';
const MAX_LOGO_SIZE = 500000; // 500KB

function SettingsPage() {
  // --- Estado ---
  const [profile, setProfile] = useState({
    nombreEmpresa: '',
    nif: '',
    direccion: '',
    contactEmail: '',
    iban: '',
    logo: ''
  });

  // --- Efectos (Carga Inicial) ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authFetch(API_URL);
        const data = await res.json();
        // Comportamiento original: Si hay data, se setea (incluso si res.ok es false)
        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, []);

  // --- Handlers ---
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
      return alert('Máximo 500KB para el logo.');
    }

    const reader = new FileReader();
    reader.onloadend = () => setProfile({ ...profile, logo: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const res = await authFetch(API_URL, {
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

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Configuración</h1>
      <p style={styles.subtitle}>Datos de la empresa</p>

      <div style={styles.card}>
        <form onSubmit={handleSave} style={styles.form}>
          
          {/* ZONA DE LOGO */}
          <div style={styles.logoSection}>
            <div style={styles.logoPreviewContainer}>
              {profile.logo ? (
                <img src={profile.logo} alt="Logo" style={styles.logoImage} />
              ) : (
                <span style={styles.logoPlaceholderIcon}>🏢</span>
              )}
            </div>
            
            <div>
              <label style={styles.labelLogo}>Logotipo</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                id="logoInput" 
                style={{ display: 'none' }} 
              />
              <label htmlFor="logoInput" style={styles.uploadButton}>
                Subir Imagen
              </label>
              
              {profile.logo && (
                <button 
                  type="button" 
                  onClick={() => setProfile({ ...profile, logo: '' })} 
                  style={styles.deleteButton}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {/* CAMPOS DE TEXTO */}
          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>Nombre / Razón Social</label>
              <input 
                name="nombreEmpresa" 
                value={profile.nombreEmpresa || ''} 
                onChange={handleChange} 
                style={styles.input} 
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>NIF / CIF</label>
              <input 
                name="nif" 
                value={profile.nif || ''} 
                onChange={handleChange} 
                style={styles.input} 
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Dirección Completa</label>
            <input 
              name="direccion" 
              value={profile.direccion || ''} 
              onChange={handleChange} 
              style={styles.input} 
            />
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>Email Público</label>
              <input 
                name="contactEmail" 
                value={profile.contactEmail || ''} 
                onChange={handleChange} 
                style={styles.input} 
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>IBAN</label>
              <input 
                name="iban" 
                value={profile.iban || ''} 
                onChange={handleChange} 
                style={styles.input} 
              />
            </div>
          </div>

          <button type="submit" style={styles.submitButton}>
            GUARDAR PERFIL
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Estilos ---
const styles = {
  container: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
  title: { fontSize: '2rem', marginBottom: '10px' },
  subtitle: { color: '#71717A', marginBottom: '40px' },
  
  // Card & Form
  card: { background: '#18181B', padding: '30px', borderRadius: '12px', border: '1px solid #27272A', color: 'white' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  // Logo Section
  logoSection: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' },
  logoPreviewContainer: { width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #333', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: '100%', height: '100%', objectFit: 'contain' },
  logoPlaceholderIcon: { fontSize: '2rem' },
  labelLogo: { display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' },
  uploadButton: { display: 'inline-block', padding: '8px 12px', background: '#27272A', color: 'white', borderRadius: '6px', cursor: 'pointer', border: '1px solid #333', fontSize: '0.8rem' },
  deleteButton: { marginLeft: '10px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' },

  // Inputs & Layout
  row: { display: 'flex', gap: '20px' },
  col: { flex: 1 },
  label: { display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#A1A1AA' },
  input: { width: '100%', padding: '12px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' },
  
  // Actions
  submitButton: { marginTop: '10px', padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};

export default SettingsPage;