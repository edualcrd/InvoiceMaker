import { useState } from "react";
import { toast } from "sonner";

// --- Constantes ---
const LOGIN_URL = "http://localhost:3000/api/auth/login";
const STORAGE_KEYS = {
  TOKEN: "invoice_token",
  PROFILE: "invoiceMaker_profile",
};

// Recibimos onLogin (para entrar) y onSwitchToRegister (para ir a crear cuenta)
function LoginPage({ onLogin, onSwitchToRegister }) {
  // --- Estado ---
  const [form, setForm] = useState({ email: "", password: "" });

  // --- Helpers Internos ---
  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveSessionData = (data) => {
    // 1. Guardar Token
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

    // 2. Actualizar perfil de empresa si existe (Lógica original preservada)
    if (data.nombreEmpresa) {
      const currentProfileStr =
        localStorage.getItem(STORAGE_KEYS.PROFILE) || "{}";
      const currentProfile = JSON.parse(currentProfileStr);

      const updatedProfile = {
        ...currentProfile,
        nombre: data.nombreEmpresa,
      };

      localStorage.setItem(
        STORAGE_KEYS.PROFILE,
        JSON.stringify(updatedProfile),
      );
    }
  };

  // --- Handler Principal ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        saveSessionData(data);
        toast.success("¡Bienvenido de nuevo!");
        onLogin(); // Avisamos a App.jsx para que quite el candado
      } else {
        toast.error(data.error || "Contraseña incorrecta");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    }
  };

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <h1 style={styles.title}>InvoiceMaker</h1>
        <p style={styles.subtitle}>Inicia sesión para gestionar tu negocio</p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>EMAIL</label>
            <input
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleInputChange}
              autoFocus
              required
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>CONTRASEÑA</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.buttonSubmit}>
            ENTRAR
          </button>
        </form>

        {/* Footer / Switch */}
        <p style={styles.footerText}>
          ¿No tienes cuenta?{" "}
          <button onClick={onSwitchToRegister} style={styles.buttonLink}>
            Regístrate gratis
          </button>
        </p>
      </div>
    </div>
  );
}

// --- Estilos ---
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#09090B",
    color: "white",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    background: "#18181B",
    borderRadius: "12px",
    border: "1px solid #27272A",
    textAlign: "center",
  },
  title: { marginBottom: "10px", fontSize: "2.5rem" },
  subtitle: { color: "#71717A", marginBottom: "40px" },
  form: {
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  label: { fontSize: "0.8rem", color: "#A1A1AA" },
  input: {
    width: "100%",
    padding: "12px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
    borderRadius: "6px",
  },
  buttonSubmit: {
    marginTop: "10px",
    width: "100%",
    padding: "15px",
    background: "white",
    color: "black",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  footerText: { marginTop: "30px", fontSize: "0.9rem", color: "#A1A1AA" },
  buttonLink: {
    background: "transparent",
    border: "none",
    color: "#10B981",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default LoginPage;
