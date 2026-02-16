import { useState } from "react";
import { toast } from "sonner";

// --- Constantes ---
const REGISTER_URL = "http://localhost:3000/api/auth/register";

function RegisterPage({ onSwitchToLogin }) {
  // --- Estado ---
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombreEmpresa: "",
  });
  const [loading, setLoading] = useState(false);

  // --- Helpers Internos ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handler Principal ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Intentando registrar:", form); // Efecto secundario original preservado

    try {
      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // Intentamos leer la respuesta del servidor (Comportamiento original: parseo incondicional)
      const data = await res.json();
      console.log("Respuesta servidor:", data); // Efecto secundario original preservado

      if (res.ok) {
        toast.success("¡Cuenta creada con éxito!");
        onSwitchToLogin();
      } else {
        toast.error(data.error || "Error al registrarse");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      toast.error("Error de conexión. ¿Está el servidor encendido?");
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Crear Cuenta</h1>
        <p style={styles.subtitle}>Empieza a gestionar tu negocio hoy.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>NOMBRE EMPRESA</label>
            <input
              name="nombreEmpresa"
              type="text"
              placeholder="Ej: Mi Negocio S.L."
              value={form.nombreEmpresa}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>EMAIL</label>
            <input
              name="email"
              type="email"
              placeholder="hola@ejemplo.com"
              value={form.email}
              onChange={handleInputChange}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.buttonBase,
              background: loading ? "#555" : "white",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "CREANDO CUENTA..." : "REGISTRARSE"}
          </button>
        </form>

        <p style={styles.footerText}>
          ¿Ya tienes cuenta?{" "}
          <button onClick={onSwitchToLogin} style={styles.linkButton}>
            Inicia Sesión
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
  title: { marginBottom: "10px", fontSize: "2rem" },
  subtitle: { color: "#71717A", marginBottom: "30px" },
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

  // Estilo base del botón (la parte dinámica se queda en el JSX para claridad del estado loading)
  buttonBase: {
    marginTop: "10px",
    width: "100%",
    padding: "15px",
    color: "black",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
  },

  footerText: { marginTop: "20px", fontSize: "0.9rem", color: "#A1A1AA" },
  linkButton: {
    background: "transparent",
    border: "none",
    color: "#10B981",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default RegisterPage;
