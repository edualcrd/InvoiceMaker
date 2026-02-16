import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authFetch } from "../api";

// --- Constantes ---
const API_URL = "http://localhost:3000/api/products";
const INITIAL_FORM = { nombre: "", precio: "" };

function ProductsPage() {
  // --- Estado ---
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  // --- Efectos ---
  useEffect(() => {
    cargarProductos();
  }, []);

  // --- Funciones de Datos ---
  const cargarProductos = async () => {
    const res = await authFetch(API_URL);
    if (res.ok) setProducts(await res.json());
  };

  // --- Helpers Internos ---
  const resetForm = () => setForm(INITIAL_FORM);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- Handlers de Acción ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.precio) {
      return toast.error("Rellena todos los campos");
    }

    await authFetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    toast.success("Servicio guardado");
    resetForm();
    cargarProductos();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Borrar servicio?")) return;

    await authFetch(`${API_URL}/${id}`, { method: "DELETE" });

    toast.success("Servicio eliminado");
    cargarProductos();
  };

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      {/* Header */}
      <h1 style={styles.title}>Catálogo de Servicios</h1>
      <p style={styles.subtitle}>Guarda tus precios habituales.</p>

      <div style={styles.contentWrapper}>
        {/* FORMULARIO */}
        <div style={styles.formPanel}>
          <h3 style={styles.formTitle}>Nuevo Servicio</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label style={styles.label}>NOMBRE</label>
              <input
                name="nombre"
                type="text"
                placeholder="Ej: Diseño Web"
                value={form.nombre}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>PRECIO (€)</label>
              <input
                name="precio"
                type="number"
                placeholder="0.00"
                value={form.precio}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.submitButton}>
              GUARDAR
            </button>
          </form>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div style={styles.listPanel}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.thConcept}>CONCEPTO</th>
                <th style={styles.thPrice}>PRECIO</th>
                <th style={styles.thAction}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} style={styles.tableRow}>
                  <td style={styles.tdName}>{p.nombre}</td>
                  <td className="mono" style={styles.tdPrice}>
                    {p.precio}€
                  </td>
                  <td style={styles.tdAction}>
                    <button
                      onClick={() => handleDelete(p._id)}
                      style={styles.deleteButton}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div style={styles.emptyMessage}>Lista vacía.</div>
          )}
        </div>
      </div>

      {/* Espaciador inferior */}
      <div style={styles.spacer}></div>
    </div>
  );
}

// --- Estilos ---
const styles = {
  container: {
    height: "100%",
    width: "100%",
    overflowY: "auto",
    padding: "40px",
    boxSizing: "border-box",
  },
  title: { fontSize: "2rem", marginBottom: "10px", color: "white" },
  subtitle: { color: "#A1A1AA", marginBottom: "40px" },
  contentWrapper: {
    display: "flex",
    gap: "40px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  // Form Panel
  formPanel: {
    flex: 1,
    minWidth: "300px",
    background: "#18181B",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #27272A",
  },
  formTitle: { marginTop: 0, color: "white", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  label: {
    fontSize: "0.8rem",
    color: "#71717A",
    display: "block",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "12px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  submitButton: {
    marginTop: "10px",
    padding: "12px",
    background: "white",
    color: "black",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // List Panel & Table
  listPanel: { flex: 2, minWidth: "300px" },
  table: { width: "100%", borderCollapse: "collapse", color: "white" },
  tableHeaderRow: {
    borderBottom: "1px solid #333",
    textAlign: "left",
    color: "#71717A",
  },
  thConcept: { padding: "10px", width: "50%" },
  thPrice: { padding: "10px", width: "25%" },
  thAction: {
    padding: "10px 20px 10px 10px",
    width: "25%",
    textAlign: "right",
  },

  tableRow: { borderBottom: "1px solid #27272A" },
  tdName: { padding: "15px 10px", fontWeight: "bold" },
  tdPrice: { padding: "10px", color: "#10B981" },
  tdAction: { padding: "10px 20px 10px 10px", textAlign: "right" },

  deleteButton: {
    background: "transparent",
    border: "1px solid #EF4444",
    color: "#EF4444",
    borderRadius: "4px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  emptyMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#52525B",
    border: "1px dashed #333",
    borderRadius: "8px",
    marginTop: "20px",
  },
  spacer: { height: "100px" },
};

export default ProductsPage;
