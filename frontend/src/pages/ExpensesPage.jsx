import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authFetch } from "../api";

// --- Constantes ---
const API_URL = "http://localhost:3000/api/expenses";
const CATEGORIAS = [
  "General",
  "Oficina / Material",
  "Suscripciones / Software",
  "Marketing / Publicidad",
  "Impuestos",
  "Sueldos / Colaboradores",
  "Alquiler / Suministros",
];

const INITIAL_FORM_STATE = {
  fecha: new Date().toISOString().split("T")[0],
  proveedor: "",
  concepto: "",
  importe: "",
  categoria: "General",
};

function ExpensesPage() {
  // --- Estado ---
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  // --- Efectos ---
  useEffect(() => {
    cargarGastos();
  }, []);

  // --- Funciones de Datos ---
  const cargarGastos = async () => {
    try {
      const res = await authFetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error cargando gastos", error);
    }
  };

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validación
    if (!form.importe || !form.proveedor || !form.concepto) {
      return toast.error(
        "Rellena todos los campos: Proveedor, Concepto e Importe",
      );
    }

    try {
      // 2. Petición al servidor
      const res = await authFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // 3. Verificación y actualización de UI
      if (res.ok) {
        toast.success("Gasto registrado correctamente");
        // Limpiamos campos pero mantenemos la fecha y otros datos del estado actual si fuera necesario
        // Nota: Mantenemos el comportamiento original de limpiar proveedor/concepto/importe/categoria
        // pero preservando la fecha actual del formulario (spread ...form).
        setForm({
          ...form,
          proveedor: "",
          concepto: "",
          importe: "",
          categoria: "General",
        });
        cargarGastos();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Error al guardar. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Borrar este gasto?")) return;

    try {
      await authFetch(`${API_URL}/${id}`, { method: "DELETE" });
      cargarGastos();
      toast.success("Eliminado");
    } catch (error) {
      console.error(error);
    }
  };

  // --- Cálculos ---
  const totalGastos = expenses.reduce((acc, curr) => acc + curr.importe, 0);

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gastos</h1>
        <div style={styles.totalBadge}>
          Total:{" "}
          <span style={styles.totalAmount}>-{totalGastos.toFixed(2)}€</span>
        </div>
      </div>

      <div style={styles.contentWrapper}>
        {/* FORMULARIO (Izquierda) */}
        <div style={styles.formPanel}>
          <h3 style={styles.formTitle}>Nuevo Gasto</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              style={styles.input}
            />

            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              style={styles.input}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              placeholder="Proveedor (Ej: Amazon)"
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
              style={styles.input}
            />

            <input
              placeholder="Concepto"
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Importe (€)"
              value={form.importe}
              onChange={(e) => setForm({ ...form, importe: e.target.value })}
              style={styles.input}
            />

            <button type="submit" style={styles.submitButton}>
              AÑADIR
            </button>
          </form>
        </div>

        {/* LISTA (Derecha) */}
        <div style={styles.listPanel}>
          {expenses.map((gasto) => (
            <div key={gasto._id} style={styles.card}>
              <div>
                <div style={styles.cardHeader}>
                  <span style={styles.providerName}>{gasto.proveedor}</span>
                  <span style={styles.categoryBadge}>
                    {gasto.categoria || "General"}
                  </span>
                </div>
                <div style={styles.cardSubtext}>
                  {new Date(gasto.fecha).toLocaleDateString()} -{" "}
                  {gasto.concepto}
                </div>
              </div>
              <div style={styles.cardActions}>
                <span style={styles.expenseAmount}>
                  -{gasto.importe.toFixed(2)}€
                </span>
                <button
                  onClick={() => handleDelete(gasto._id)}
                  style={styles.deleteButton}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <p style={styles.emptyMessage}>No hay gastos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Estilos ---
const styles = {
  container: { padding: "40px", maxWidth: "1000px", margin: "0 auto" },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: { fontSize: "2rem", margin: 0 },
  totalBadge: {
    background: "#27272A",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  totalAmount: { color: "#EF4444", fontWeight: "bold", fontSize: "1.2rem" },

  // Layout
  contentWrapper: { display: "flex", gap: "30px", alignItems: "flex-start" },

  // Formulario
  formPanel: {
    flex: 1,
    background: "#18181B",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #333",
  },
  formTitle: { marginTop: 0 },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: {
    padding: "10px",
    background: "#09090B",
    border: "1px solid #333",
    color: "white",
    borderRadius: "4px",
  },
  submitButton: {
    padding: "12px",
    background: "white",
    color: "black",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // Lista
  listPanel: { flex: 2 },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#18181B",
    border: "1px solid #27272A",
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "8px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "5px",
  },
  providerName: { fontWeight: "bold" },
  categoryBadge: {
    fontSize: "0.7rem",
    background: "#3F3F46",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#E4E4E7",
  },
  cardSubtext: { fontSize: "0.85rem", color: "#71717A" },
  cardActions: { display: "flex", alignItems: "center", gap: "15px" },
  expenseAmount: { color: "#EF4444", fontWeight: "bold" },
  deleteButton: {
    background: "transparent",
    border: "none",
    color: "#52525B",
    cursor: "pointer",
  },
  emptyMessage: { textAlign: "center", color: "#555" },
};

export default ExpensesPage;
