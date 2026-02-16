import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authFetch } from "../api";

// Constantes para evitar valores "hardcodeados" repetidos
const API_URL = "http://localhost:3000/api/clients";
const INITIAL_FORM_STATE = { nombre: "", nif: "", email: "", direccion: "" };

function ClientsPage() {
  // --- Estado ---
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState(null);

  // --- Efectos ---
  useEffect(() => {
    cargarClientes();
  }, []);

  // --- Funciones de Datos (API) ---
  const cargarClientes = async () => {
    try {
      const res = await authFetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error cargando clientes", error);
    }
  };

  // --- Handlers de Acción ---
  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres borrar este cliente?")) return;

    const res = await authFetch(`${API_URL}/${id}`, { method: "DELETE" });

    if (res.ok) {
      toast.success("Cliente eliminado");
      cargarClientes();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const options = {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(form),
    };

    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const res = await authFetch(url, options);

    if (res.ok) {
      resetForm();
      cargarClientes();
      toast.success(editingId ? "Cliente actualizado" : "Cliente creado");
    } else {
      toast.error("Error al guardar");
    }
  };

  // --- Helpers de Formulario ---
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (cliente) => {
    setForm(cliente);
    setEditingId(cliente._id);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(INITIAL_FORM_STATE);
  };

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Cartera de Clientes</h1>
          <p style={styles.subtitle}>Gestiona tus contactos comerciales</p>
        </div>
        <div style={styles.badge}>
          Total: <strong style={styles.badgeCount}>{clients.length}</strong>
        </div>
      </div>

      <div style={styles.contentWrapper}>
        {/* IZQUIERDA: FORMULARIO */}
        <div style={styles.formPanel}>
          <h3 style={styles.formTitle}>
            {editingId ? "Editar Cliente" : "Nuevo Cliente"}
          </h3>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label style={styles.label}>NOMBRE FISCAL *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>NIF / CIF *</label>
              <input
                name="nif"
                value={form.nif}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>EMAIL CONTACTO</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>DIRECCIÓN</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              style={
                editingId ? styles.buttonSubmitEdit : styles.buttonSubmitNew
              }
            >
              {editingId ? "GUARDAR CAMBIOS" : "+ AÑADIR CLIENTE"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={styles.buttonCancel}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>

        {/* DERECHA: TABLA */}
        <div style={styles.tablePanel}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>EMPRESA</th>
                <th style={styles.th}>ID FISCAL</th>
                <th style={styles.th}>CONTACTO</th>
                <th style={styles.thRight}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id} style={styles.tableRow}>
                  <td style={styles.tdBold}>{client.nombre}</td>
                  <td className="mono" style={styles.td}>
                    {client.nif}
                  </td>
                  <td style={styles.tdGray}>{client.email || "-"}</td>
                  <td style={styles.tdRight}>
                    <button
                      onClick={() => handleEdit(client)}
                      style={styles.actionButtonEdit}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(client._id)}
                      style={styles.actionButtonDelete}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && (
            <p style={styles.emptyMessage}>No hay clientes registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Objeto de estilos extraído para limpiar el JSX
const styles = {
  container: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  title: { margin: 0, fontSize: "2rem" },
  subtitle: { color: "#71717A" },
  badge: {
    background: "#09090B",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  badgeCount: { color: "#10B981" },
  contentWrapper: { display: "flex", gap: "40px", alignItems: "flex-start" },

  // Form Styles
  formPanel: {
    flex: 1,
    background: "#18181B",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #27272A",
    color: "white",
  },
  formTitle: { marginTop: 0 },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  label: {
    fontSize: "0.8rem",
    color: "#A1A1AA",
    display: "block",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "10px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
  },

  // Buttons
  buttonSubmitNew: {
    marginTop: "10px",
    padding: "12px",
    background: "white",
    color: "black",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  buttonSubmitEdit: {
    marginTop: "10px",
    padding: "12px",
    background: "#EAB308",
    color: "black",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  buttonCancel: {
    marginTop: "10px",
    padding: "10px",
    background: "transparent",
    color: "#A1A1AA",
    border: "1px solid #333",
    cursor: "pointer",
  },

  // Table Styles
  tablePanel: { flex: 2 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  tableHeaderRow: { borderBottom: "2px solid #E4E4E7", textAlign: "left" },
  th: { padding: "10px", color: "#71717A" },
  thRight: { padding: "10px", textAlign: "right" },
  tableRow: { borderBottom: "1px solid #E4E4E7" },
  td: { padding: "10px" },
  tdBold: { padding: "15px 10px", fontWeight: "bold" },
  tdGray: { padding: "10px", color: "#71717A" },
  tdRight: { padding: "10px", textAlign: "right" },

  // Actions
  actionButtonEdit: {
    marginRight: "10px",
    background: "transparent",
    border: "1px solid #EAB308",
    color: "#EAB308",
    borderRadius: "4px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  actionButtonDelete: {
    background: "transparent",
    border: "1px solid #EF4444",
    color: "#EF4444",
    borderRadius: "4px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  emptyMessage: { textAlign: "center", color: "#A1A1AA", marginTop: "40px" },
};

export default ClientsPage;
