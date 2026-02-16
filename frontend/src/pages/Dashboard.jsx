import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { authFetch } from "../api";
import InvoicePDF from "../InvoicePDF";
import "../App.css";

// --- Constantes y Configuración ---
const API_BASE = "http://localhost:3000/api";
const COLORES_QUESO = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
];
const INITIAL_ITEM = { concepto: "", cantidad: 1, precio: 0 };

function Dashboard() {
  // --- Estados de Datos ---
  const [clients, setClients] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [perfil, setPerfil] = useState(null);

  // --- Estados de UI / Filtros ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [editingId, setEditingId] = useState(null);

  // --- Estados del Formulario ---
  const [selectedClient, setSelectedClient] = useState("");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [vencimiento, setVencimiento] = useState("");
  const [items, setItems] = useState([INITIAL_ITEM]);
  const [tipoIva, setTipoIva] = useState(21);

  // --- Carga Inicial ---
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // Cargamos recursos en paralelo (comportamiento original)
      authFetch(`${API_BASE}/clients`)
        .then((res) => res.json())
        .then(setClients);
      authFetch(`${API_BASE}/invoices`)
        .then((res) => res.json())
        .then(setFacturas);
      authFetch(`${API_BASE}/products`)
        .then((res) => res.json())
        .then(setProductosCatalogo);
      authFetch(`${API_BASE}/expenses`)
        .then((res) => res.json())
        .then(setGastos);

      fetchNextNumber();

      authFetch(`${API_BASE}/user/profile`)
        .then((res) => res.json())
        .then((data) => {
          setPerfil({
            nombre: data.nombreEmpresa,
            nif: data.nif,
            direccion: data.direccion,
            email: data.contactEmail,
            iban: data.iban,
            logo: data.logo,
          });
        });
    } catch (error) {
      console.error("Error cargando datos iniciales", error);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const res = await authFetch(`${API_BASE}/invoices/next-number`);
      const data = await res.json();
      setNumero(data.next);
    } catch (e) {
      console.error("Error al calcular número");
    }
  };

  // --- Cálculos y Transformaciones ---
  const calcularTotal = () => {
    const base = items.reduce(
      (acc, item) => acc + item.cantidad * item.precio,
      0,
    );
    const iva = base * (tipoIva / 100);
    const irpf = base * 0.15; // IRPF fijo del 15%
    return { base, iva, irpf, total: base + iva - irpf };
  };

  const totales = calcularTotal();
  const totalGastos = gastos.reduce((acc, g) => acc + g.importe, 0);

  const kpis = {
    ingresos: facturas.reduce((acc, f) => acc + f.total, 0),
    gastos: totalGastos,
    beneficio: facturas.reduce((acc, f) => acc + f.total, 0) - totalGastos,
    pendiente: facturas
      .filter((f) => !f.pagada)
      .reduce((acc, f) => acc + f.total, 0),
  };

  // Preparación de datos para gráficas
  const datosGrafica = [...facturas]
    .reverse()
    .slice(0, 5)
    .reverse()
    .map((f) => ({
      nombre: f.cliente.nombre.split(" ")[0],
      total: f.total,
      estado: f.pagada ? "Cobrado" : "Pendiente",
    }));

  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    const cat = gasto.categoria || "General";
    acc[cat] = (acc[cat] || 0) + gasto.importe;
    return acc;
  }, {});

  const datosQueso = Object.keys(gastosPorCategoria).map((key) => ({
    name: key,
    value: gastosPorCategoria[key],
  }));

  const facturasFiltradas = facturas.filter((f) => {
    const coincideTexto =
      f.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.numero.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todos"
        ? true
        : filtroEstado === "pagadas"
          ? f.pagada === true
          : f.pagada === false; // pendientes

    return coincideTexto && coincideEstado;
  });

  // --- Handlers de Formulario ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, INITIAL_ITEM]);

  const addProductFromCatalog = (e) => {
    const productId = e.target.value;
    if (!productId) return;
    const productoElegido = productosCatalogo.find((p) => p._id === productId);
    setItems([
      ...items,
      {
        concepto: productoElegido.nombre,
        cantidad: 1,
        precio: productoElegido.precio,
      },
    ]);
  };

  const cargarParaEditar = (factura) => {
    setEditingId(factura._id);
    setNumero(factura.numero);
    setFecha(factura.fecha.split("T")[0]);
    setVencimiento(
      factura.vencimiento ? factura.vencimiento.split("T")[0] : "",
    );

    const clienteExistente = clients.find((c) => c.nif === factura.cliente.nif);
    setSelectedClient(clienteExistente ? clienteExistente._id : "");

    setItems(
      factura.items.map((i) => ({
        concepto: i.concepto,
        cantidad: i.cantidad,
        precio: i.precio,
      })),
    );
    setTipoIva(factura.tipoIva || 21);
    toast.info("Editando factura " + factura.numero);
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setItems([INITIAL_ITEM]);
    setTipoIva(21);
    setNumero("");
    fetchNextNumber();
    toast.info("Edición cancelada");
  };

  // --- Acciones Principales (Guardar, Borrar, Exportar) ---
  const guardarFactura = async (e) => {
    e.preventDefault();
    if (!selectedClient) return toast.error("Por favor, selecciona un cliente");

    const clienteData = clients.find((c) => c._id === selectedClient);
    const datosCliente = clienteData
      ? {
          nombre: clienteData.nombre,
          nif: clienteData.nif,
          email: clienteData.email,
          direccion: clienteData.direccion,
        }
      : null;

    const facturaFinal = {
      numero,
      fecha,
      vencimiento,
      cliente: datosCliente,
      items,
      baseImponible: totales.base,
      total: totales.total,
      pagada: false,
      tipoIva: tipoIva,
    };
    if (!datosCliente) delete facturaFinal.cliente;

    let res;
    const headers = { "Content-Type": "application/json" };

    if (editingId) {
      res = await authFetch(`${API_BASE}/invoices/${editingId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(facturaFinal),
      });
    } else {
      res = await authFetch(`${API_BASE}/invoices`, {
        method: "POST",
        headers,
        body: JSON.stringify(facturaFinal),
      });
    }

    if (res.ok) {
      toast.success(editingId ? "Factura actualizada" : "Factura creada");
      const nuevaLista = await authFetch(`${API_BASE}/invoices`).then((r) =>
        r.json(),
      );
      setFacturas(nuevaLista);
      setEditingId(null);
      setItems([INITIAL_ITEM]);
      if (!editingId) fetchNextNumber();
    } else {
      toast.error("Error al guardar");
    }
  };

  const borrarFactura = async (id) => {
    if (!confirm("¿Seguro que quieres borrar esta factura?")) return;
    await authFetch(`${API_BASE}/invoices/${id}`, { method: "DELETE" });
    setFacturas(facturas.filter((f) => f._id !== id));
    toast.success("Factura eliminada");
  };

  const togglePagada = async (id) => {
    await authFetch(`${API_BASE}/invoices/${id}`, { method: "PATCH" });
    const nuevaLista = await authFetch(`${API_BASE}/invoices`).then((r) =>
      r.json(),
    );
    setFacturas(nuevaLista);
    toast.info("Estado actualizado");
  };

  const exportarCSV = () => {
    const datos = facturasFiltradas;
    if (datos.length === 0) return toast.error("No hay datos para exportar");

    const cabeceras = [
      "Numero",
      "Fecha",
      "Cliente",
      "NIF",
      "Base",
      "IVA",
      "Total",
      "Estado",
    ];
    const filas = datos.map((f) => {
      const nombreCliente = f.cliente?.nombre || "Cliente General";
      const nifCliente = f.cliente?.nif || "";
      const base = (f.baseImponible || 0).toFixed(2);
      const iva = (f.iva || 0).toFixed(2);
      const total = (f.total || 0).toFixed(2);
      const fecha = f.fecha ? f.fecha.split("T")[0] : "";

      return [
        `"${f.numero}"`,
        `"${fecha}"`,
        `"${nombreCliente}"`,
        `"${nifCliente}"`,
        `"${base}"`,
        `"${iva}"`,
        `"${total}"`,
        f.pagada ? "PAGADA" : "PENDIENTE",
      ].join(",");
    });

    const contenidoCSV = "\uFEFF" + [cabeceras.join(","), ...filas].join("\n");
    const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "facturas_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Renderizado ---
  return (
    <div style={styles.container}>
      <h1 className="logo-big" style={styles.pageTitle}>
        Panel de Control
      </h1>

      {/* SECCIÓN DE KPIS */}
      <div style={styles.kpiGrid}>
        {/* Ingresos */}
        <div style={styles.kpiCard}>
          <p style={styles.kpiLabel}>Ingresos Totales</p>
          <h2 className="mono" style={styles.kpiValuePositive}>
            +{kpis.ingresos.toFixed(2)}€
          </h2>
        </div>

        {/* Gastos */}
        <div style={styles.kpiCard}>
          <p style={styles.kpiLabel}>Gastos Totales</p>
          <h2 className="mono" style={styles.kpiValueNegative}>
            -{kpis.gastos.toFixed(2)}€
          </h2>
        </div>

        {/* Beneficio */}
        <div style={styles.kpiCardHighlight}>
          <p style={styles.kpiLabelHighlight}>Beneficio Neto</p>
          <h2 className="mono" style={styles.kpiValueWhite}>
            {kpis.beneficio > 0 ? "+" : ""}
            {kpis.beneficio.toFixed(2)}€
          </h2>
        </div>

        {/* Pendiente */}
        <div style={styles.kpiCardDimmed}>
          <p style={styles.kpiLabel}>Pendiente de Cobro</p>
          <h2 className="mono" style={styles.kpiValueDimmed}>
            {kpis.pendiente.toFixed(2)}€
          </h2>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICAS */}
      <div style={styles.chartsContainer}>
        {/* Gráfica Barras */}
        <div style={styles.chartWrapperPrimary}>
          <h3 style={styles.chartTitle}>Ingresos vs Pendiente</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={datosGrafica} barSize={40}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#27272A"
              />
              <XAxis
                dataKey="nombre"
                stroke="#71717A"
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#71717A"
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#27272A", opacity: 0.5 }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {datosGrafica.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.estado === "Cobrado" ? "#10B981" : "#3F3F46"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica Queso */}
        <div style={styles.chartWrapperSecondary}>
          <h3 style={styles.chartTitle}>Distribución de Gastos</h3>
          {datosQueso.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={datosQueso}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {datosQueso.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORES_QUESO[index % COLORES_QUESO.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={styles.legendStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyChart}>
              <p>Sin gastos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* ZONA DE TRABAJO */}
      <div style={styles.workspaceContainer}>
        {/* EDITOR (Izquierda) */}
        <div style={styles.editorPanel}>
          <h3 style={styles.panelTitle}>
            {editingId ? "Editar Factura" : "Nueva Factura"}
          </h3>
          <form onSubmit={guardarFactura}>
            {/* Cabecera Factura */}
            <div style={styles.invoiceHeaderGrid}>
              <div>
                <label style={styles.labelSmall}>NÚMERO</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.labelSmall}>FECHA</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.labelSmall}>VENCIMIENTO</label>
                <input
                  type="date"
                  value={vencimiento}
                  onChange={(e) => setVencimiento(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Selector Cliente */}
            <div style={styles.mb20}>
              <label style={styles.labelSmall}>CLIENTE</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Items */}
            <div style={styles.mb20}>
              {items.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <input
                    placeholder="Concepto"
                    value={item.concepto}
                    onChange={(e) =>
                      handleItemChange(index, "concepto", e.target.value)
                    }
                    style={styles.inputConcept}
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={item.cantidad}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "cantidad",
                        Number(e.target.value),
                      )
                    }
                    style={styles.inputQty}
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    value={item.precio}
                    onChange={(e) =>
                      handleItemChange(index, "precio", Number(e.target.value))
                    }
                    style={styles.inputPrice}
                  />
                </div>
              ))}

              <div style={styles.itemActions}>
                <button
                  type="button"
                  onClick={addItem}
                  style={styles.btnAddLine}
                >
                  + Línea Vacía
                </button>
                <select
                  onChange={addProductFromCatalog}
                  style={styles.selectProduct}
                  value=""
                >
                  <option value="" disabled>
                    Añadir Servicio Rápido...
                  </option>
                  {productosCatalogo.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.nombre} ({p.precio}€)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Totales e Impuestos */}
            <div style={styles.taxSection}>
              <label style={styles.taxLabel}>Impuestos:</label>
              <select
                value={tipoIva}
                onChange={(e) => setTipoIva(Number(e.target.value))}
                style={styles.selectTax}
              >
                <option value={21}>21% IVA</option>
                <option value={10}>10% IVA (Reducido)</option>
                <option value={4}>4% IVA (Superreducido)</option>
                <option value={0}>0% (Exento)</option>
              </select>
            </div>

            <div style={styles.totalsSummary}>
              <p style={styles.totalRow}>Base: {totales.base.toFixed(2)}€</p>
              <p style={styles.totalRowGray}>
                IVA ({tipoIva}%): {totales.iva.toFixed(2)}€
              </p>
              <p style={styles.totalRowRed}>
                IRPF (15%): -{totales.irpf.toFixed(2)}€
              </p>
              <h2 className="mono" style={styles.totalFinal}>
                Total: {totales.total.toFixed(2)}€
              </h2>
            </div>

            {/* Botones Acción */}
            <div style={styles.formActions}>
              <button
                type="submit"
                style={editingId ? styles.btnSubmitEdit : styles.btnSubmitNew}
              >
                {editingId ? "GUARDAR CAMBIOS" : "EMITIR FACTURA"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  style={styles.btnCancel}
                >
                  CANCELAR
                </button>
              )}
            </div>
          </form>
        </div>

        {/* HISTORIAL (Derecha) */}
        <div style={styles.historyPanel}>
          <h3 style={styles.panelTitleHistory}>Historial</h3>

          <div style={styles.filterContainer}>
            <button
              onClick={() => setFiltroEstado("todos")}
              style={
                filtroEstado === "todos"
                  ? styles.filterBtnActive
                  : styles.filterBtn
              }
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroEstado("pendientes")}
              style={
                filtroEstado === "pendientes"
                  ? styles.filterBtnPendingActive
                  : styles.filterBtn
              }
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltroEstado("pagadas")}
              style={
                filtroEstado === "pagadas"
                  ? styles.filterBtnPaidActive
                  : styles.filterBtn
              }
            >
              Pagadas
            </button>
          </div>

          <button onClick={exportarCSV} style={styles.btnExport}>
            Descargar Informe Excel (.csv)
          </button>

          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputSearch}
          />

          {facturasFiltradas.length === 0 && (
            <p style={styles.noResults}>No encontrado.</p>
          )}

          {facturasFiltradas.map((f) => (
            <div
              key={f._id}
              style={{ ...styles.invoiceCard, opacity: f.pagada ? 0.6 : 1 }}
            >
              <div style={styles.invoiceCardHeader}>
                <div style={styles.invoiceCardTitleGroup}>
                  <strong style={styles.invoiceNumber}>{f.numero}</strong>
                  {f.pagada && <span style={styles.badgePaid}>PAGADA</span>}
                </div>
                <span
                  className="mono"
                  style={
                    f.pagada
                      ? styles.invoiceTotalPaid
                      : styles.invoiceTotalPending
                  }
                >
                  {f.total.toFixed(2)}€
                </span>
              </div>
              <div style={styles.invoiceClientName}>{f.cliente.nombre}</div>

              <div style={styles.invoiceCardActions}>
                <button
                  onClick={() => cargarParaEditar(f)}
                  style={styles.btnIconEdit}
                >
                  ✎
                </button>
                <PDFDownloadLink
                  document={<InvoicePDF factura={f} perfil={perfil} />}
                  fileName={`Factura-${f.numero}.pdf`}
                  style={styles.btnPdf}
                >
                  {({ loading }) => (loading ? "..." : " PDF")}
                </PDFDownloadLink>
                <button
                  onClick={() => togglePagada(f._id)}
                  style={styles.btnTogglePaid}
                >
                  {f.pagada ? "Deshacer" : "Cobrar"}
                </button>
                <button
                  onClick={() => borrarFactura(f._id)}
                  style={styles.btnIconDelete}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer inferior */}
      <div style={styles.spacer}></div>
    </div>
  );
}

// Componente para el Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={styles.tooltipContainer}>
        <p style={styles.tooltipLabel}>{label || payload[0].name}</p>
        <p style={{ margin: 0, color: payload[0].fill }}>
          {payload[0].value.toFixed(2)}€
        </p>
      </div>
    );
  }
  return null;
};

// --- Objeto de Estilos ---
const styles = {
  container: {
    height: "100%",
    width: "100%",
    overflowY: "auto",
    padding: "20px 20px 150px 20px",
    boxSizing: "border-box",
  },
  pageTitle: { fontSize: "2rem" },

  // KPIs
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
    width: "100%",
    maxWidth: "1000px",
  },
  kpiCard: {
    background: "#18181B",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #333",
  },
  kpiCardHighlight: {
    background: "#27272A",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #EAB308",
  },
  kpiCardDimmed: {
    background: "#18181B",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #333",
    opacity: 0.7,
  },
  kpiLabel: { color: "#A1A1AA", fontSize: "0.9rem", margin: 0 },
  kpiLabelHighlight: {
    color: "#EAB308",
    fontSize: "0.9rem",
    margin: 0,
    fontWeight: "bold",
  },
  kpiValuePositive: { fontSize: "1.8rem", margin: "10px 0", color: "#10B981" },
  kpiValueNegative: { fontSize: "1.8rem", margin: "10px 0", color: "#EF4444" },
  kpiValueWhite: { fontSize: "1.8rem", margin: "10px 0", color: "white" },
  kpiValueDimmed: { fontSize: "1.8rem", margin: "10px 0", color: "#A1A1AA" },

  // Gráficas
  chartsContainer: {
    display: "flex",
    gap: "20px",
    width: "100%",
    maxWidth: "1000px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },
  chartWrapperPrimary: {
    flex: 3,
    minWidth: "350px",
    height: "400px",
    background: "#18181B",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #27272A",
  },
  chartWrapperSecondary: {
    flex: 2,
    minWidth: "300px",
    height: "400px",
    background: "#18181B",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #27272A",
  },
  chartTitle: {
    margin: "0 0 30px 0",
    color: "white",
    fontSize: "1rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  legendStyle: { fontSize: "12px", color: "#A1A1AA" },
  emptyChart: {
    height: "80%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#52525B",
    border: "2px dashed #27272A",
    borderRadius: "8px",
  },

  // Workspace
  workspaceContainer: {
    display: "flex",
    gap: "20px",
    width: "100%",
    maxWidth: "1000px",
    alignItems: "flex-start",
  },

  // Editor
  editorPanel: {
    flex: 2,
    background: "#18181B",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #333",
  },
  panelTitle: { marginTop: 0 },
  invoiceHeaderGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    marginBottom: "10px",
  },
  labelSmall: {
    display: "block",
    fontSize: "0.7rem",
    color: "#71717A",
    marginBottom: "4px",
  },
  input: {
    height: "40px",
    width: "100%",
    padding: "8px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
    borderRadius: "4px",
  },
  mb20: { marginBottom: "20px" },
  select: {
    width: "100%",
    padding: "10px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
    borderRadius: "4px",
  },

  // Items
  itemRow: { display: "flex", gap: "5px", marginBottom: "5px" },
  inputConcept: {
    flex: 2,
    padding: "5px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
  },
  inputQty: {
    width: "50px",
    padding: "5px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
  },
  inputPrice: {
    width: "70px",
    padding: "5px",
    background: "#09090B",
    color: "white",
    border: "1px solid #333",
  },
  itemActions: { display: "flex", gap: "10px", marginTop: "10px" },
  btnAddLine: {
    fontSize: "0.8rem",
    padding: "8px 12px",
    cursor: "pointer",
    background: "transparent",
    color: "#A1A1AA",
    border: "1px solid #333",
    borderRadius: "4px",
  },
  selectProduct: {
    fontSize: "0.8rem",
    padding: "8px",
    cursor: "pointer",
    background: "#27272A",
    color: "white",
    border: "none",
    borderRadius: "4px",
    outline: "none",
  },

  // Taxes & Totals
  taxSection: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
  },
  taxLabel: { fontSize: "0.9rem", color: "#A1A1AA" },
  selectTax: {
    padding: "5px",
    background: "#27272A",
    color: "white",
    border: "1px solid #333",
    borderRadius: "4px",
  },
  totalsSummary: {
    textAlign: "right",
    borderTop: "1px solid #333",
    paddingTop: "10px",
  },
  totalRow: { margin: "5px 0", fontSize: "0.9rem" },
  totalRowGray: { margin: "5px 0", fontSize: "0.9rem", color: "#A1A1AA" },
  totalRowRed: { margin: "5px 0", fontSize: "0.9rem", color: "#EF4444" },
  totalFinal: { color: "white", marginTop: "10px" },

  // Form Actions
  formActions: { display: "flex", gap: "10px", marginTop: "20px" },
  btnSubmitNew: {
    flex: 1,
    padding: "15px",
    background: "white",
    color: "black",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnSubmitEdit: {
    flex: 1,
    padding: "15px",
    background: "#EAB308",
    color: "black",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnCancel: {
    padding: "0 20px",
    background: "transparent",
    color: "#EF4444",
    fontWeight: "bold",
    border: "1px solid #EF4444",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // History Panel
  historyPanel: {
    flex: 1,
    background: "#09090B",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #333",
    maxHeight: "600px",
    overflowY: "auto",
  },
  panelTitleHistory: {
    marginTop: 0,
    borderBottom: "1px solid #333",
    paddingBottom: "10px",
  },
  filterContainer: { display: "flex", gap: "10px", marginBottom: "15px" },
  filterBtn: {
    flex: 1,
    padding: "8px",
    background: "transparent",
    color: "#71717A",
    border: "1px solid #333",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.8rem",
  },
  filterBtnActive: {
    flex: 1,
    padding: "8px",
    background: "white",
    color: "black",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.8rem",
  },
  filterBtnPendingActive: {
    flex: 1,
    padding: "8px",
    background: "#EF4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.8rem",
  },
  filterBtnPaidActive: {
    flex: 1,
    padding: "8px",
    background: "#10B981",
    color: "black",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.8rem",
  },

  btnExport: {
    width: "100%",
    marginBottom: "15px",
    padding: "10px",
    background: "#27272A",
    color: "#A1A1AA",
    border: "1px dashed #52525B",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  inputSearch: {
    width: "92.5%",
    padding: "10px",
    marginBottom: "20px",
    background: "#18181B",
    border: "1px solid #333",
    color: "white",
    borderRadius: "6px",
  },
  noResults: { color: "#666", textAlign: "center" },

  // Invoice Card
  invoiceCard: {
    border: "1px solid #27272A",
    background: "#18181B",
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "8px",
  },
  invoiceCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  invoiceCardTitleGroup: { display: "flex", alignItems: "center", gap: "10px" },
  invoiceNumber: { fontSize: "1.1rem" },
  badgePaid: {
    background: "#10B981",
    color: "black",
    fontSize: "0.6rem",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "bold",
  },
  invoiceTotalPaid: { color: "#10B981", fontSize: "1.1rem" },
  invoiceTotalPending: { color: "white", fontSize: "1.1rem" },
  invoiceClientName: {
    fontSize: "0.9rem",
    color: "#A1A1AA",
    marginBottom: "15px",
  },
  invoiceCardActions: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
    borderTop: "1px solid #27272A",
    paddingTop: "10px",
  },

  // Icon Buttons
  btnIconEdit: {
    width: "40px",
    background: "transparent",
    border: "1px solid #EAB308",
    color: "#EAB308",
    cursor: "pointer",
    borderRadius: "4px",
  },
  btnIconDelete: {
    width: "40px",
    background: "#3f1515",
    border: "1px solid #EF4444",
    color: "#EF4444",
    cursor: "pointer",
    borderRadius: "4px",
  },
  btnPdf: {
    flex: 1,
    textAlign: "center",
    textDecoration: "none",
    padding: "8px",
    background: "#E4E4E7",
    color: "black",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  btnTogglePaid: {
    flex: 1,
    background: "transparent",
    border: "1px solid #10B981",
    color: "#10B981",
    cursor: "pointer",
    borderRadius: "4px",
  },

  spacer: { height: "50px", width: "100%", flexShrink: 0 },

  // Tooltip
  tooltipContainer: {
    background: "#09090B",
    border: "1px solid #333",
    padding: "10px",
    borderRadius: "8px",
  },
  tooltipLabel: { margin: 0, fontWeight: "bold", color: "#E4E4E7" },
};

export default Dashboard;
