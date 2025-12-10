// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { authFetch } from '../api'; // <--- IMPORTANTE: El conector seguro
import InvoicePDF from '../InvoicePDF';
import '../App.css';

function Dashboard() {
  // --- ESTADOS ---
  const [clients, setClients] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]); // Catálogo
  const [perfil, setPerfil] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Formulario
  const [editingId, setEditingId] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [vencimiento, setVencimiento] = useState('');
  const [items, setItems] = useState([{ concepto: '', cantidad: 1, precio: 0 }]);

  // --- CARGA INICIAL ---
  useEffect(() => {
    // 1. Cargar Clientes
    authFetch('http://localhost:3000/api/clients')
      .then(res => res.json())
      .then(data => setClients(data));

    // 2. Cargar Facturas
    authFetch('http://localhost:3000/api/invoices')
      .then(res => res.json())
      .then(data => setFacturas(data));

    // 3. Cargar Catálogo (Para el desplegable)
    authFetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => setProductosCatalogo(data));

    // 4. Calcular siguiente número
    fetchNextNumber();

    // 5. Cargar perfil local
    const savedProfile = localStorage.getItem('invoiceMaker_profile');
    if (savedProfile) setPerfil(JSON.parse(savedProfile));
  }, []);

  // --- FUNCIONES AUXILIARES ---
  const fetchNextNumber = async () => {
    try {
      const res = await authFetch('http://localhost:3000/api/invoices/next-number');
      const data = await res.json();
      setNumero(data.next);
    } catch (e) {
      console.error('Error al calcular número');
    }
  };

  const calcularTotal = () => {
    const base = items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
    const iva = base * 0.21;
    const irpf = base * 0.15;
    return { base, iva, irpf, total: base + iva - irpf };
  };
  const totales = calcularTotal();

  const kpis = {
    totalFacturado: facturas.reduce((acc, f) => acc + f.total, 0),
    totalPendiente: facturas.filter(f => !f.pagada).reduce((acc, f) => acc + f.total, 0),
    totalCobrado: facturas.filter(f => f.pagada).reduce((acc, f) => acc + f.total, 0)
  };

  const datosGrafica = [...facturas].reverse().slice(0, 5).reverse().map(f => ({
    nombre: f.cliente.nombre.split(' ')[0],
    total: f.total,
    estado: f.pagada ? 'Cobrado' : 'Pendiente'
  }));

  const facturasFiltradas = facturas.filter(f => {
    const coincideTexto = 
      f.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.numero.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = 
      filtroEstado === 'todos' ? true :
      filtroEstado === 'pagadas' ? f.pagada === true :
      f.pagada === false;
    return coincideTexto && coincideEstado;
  });

  // --- HANDLERS ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  const addItem = () => setItems([...items, { concepto: '', cantidad: 1, precio: 0 }]);
  
  const addProductFromCatalog = (e) => {
    const productId = e.target.value;
    if (!productId) return;
    const productoElegido = productosCatalogo.find(p => p._id === productId);
    setItems([...items, { concepto: productoElegido.nombre, cantidad: 1, precio: productoElegido.precio }]);
  };

  const cargarParaEditar = (factura) => {
    setEditingId(factura._id);
    setNumero(factura.numero);
    setFecha(factura.fecha.split('T')[0]);
    setVencimiento(factura.vencimiento ? factura.vencimiento.split('T')[0] : '');
    // Buscar ID del cliente si existe en la lista actual
    const clienteExistente = clients.find(c => c.nif === factura.cliente.nif); 
    setSelectedClient(clienteExistente ? clienteExistente._id : ''); 
    setItems(factura.items.map(i => ({ concepto: i.concepto, cantidad: i.cantidad, precio: i.precio })));
    toast.info('Editando factura ' + factura.numero);
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setItems([{ concepto: '', cantidad: 1, precio: 0 }]);
    setNumero('');
    fetchNextNumber();
    toast.info('Edición cancelada');
  };

  const guardarFactura = async (e) => {
    e.preventDefault();
    if (!selectedClient) return toast.error('Por favor, selecciona un cliente');
    const clienteData = clients.find(c => c._id === selectedClient);
    
    // Si editamos y el cliente ya no existe en la BD, intentamos mantener el antiguo si no se seleccionó otro
    const datosCliente = clienteData ? { 
        nombre: clienteData.nombre, nif: clienteData.nif, email: clienteData.email, direccion: clienteData.direccion 
    } : null;

    const facturaFinal = {
      numero, fecha, vencimiento, cliente: datosCliente, items,
      baseImponible: totales.base, total: totales.total, pagada: false
    };
    if (!datosCliente) delete facturaFinal.cliente;

    let res;
    if (editingId) {
      res = await authFetch(`http://localhost:3000/api/invoices/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(facturaFinal)
      });
    } else {
      res = await authFetch('http://localhost:3000/api/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(facturaFinal)
      });
    }

    if (res.ok) {
      toast.success(editingId ? 'Factura actualizada' : 'Factura creada');
      const nuevaLista = await authFetch('http://localhost:3000/api/invoices').then(r => r.json());
      setFacturas(nuevaLista);
      setEditingId(null);
      setItems([{ concepto: '', cantidad: 1, precio: 0 }]);
      if (!editingId) fetchNextNumber();
    } else {
      toast.error('Error al guardar');
    }
  };

  const borrarFactura = async (id) => {
    if (!confirm('¿Seguro que quieres borrar esta factura?')) return;
    await authFetch(`http://localhost:3000/api/invoices/${id}`, { method: 'DELETE' });
    setFacturas(facturas.filter(f => f._id !== id));
    toast.success('Factura eliminada');
  };

  const togglePagada = async (id) => {
    await authFetch(`http://localhost:3000/api/invoices/${id}`, { method: 'PATCH' });
    const nuevaLista = await authFetch('http://localhost:3000/api/invoices').then(r => r.json());
    setFacturas(nuevaLista);
    toast.info('Estado actualizado');
  };

  const exportarCSV = () => {
    const datos = facturasFiltradas;
    if (datos.length === 0) return toast.error('No hay datos para exportar');
    const cabeceras = ['Numero', 'Fecha', 'Cliente', 'NIF', 'Base', 'IVA', 'Total', 'Estado'];
    const filas = datos.map(f => [
        `"${f.numero}"`, `"${f.fecha.split('T')[0]}"`, `"${f.cliente.nombre}"`, `"${f.cliente.nif}"`,
        f.baseImponible.toFixed(2), f.iva.toFixed(2), f.total.toFixed(2), f.pagada ? 'PAGADA' : 'PENDIENTE'
      ].join(','));
    const contenidoCSV = [cabeceras.join(','), ...filas].join('\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `facturas_export.csv`;
    link.click();
  };

  // --- RENDERIZADO ---
  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '20px 20px 150px 20px', boxSizing: 'border-box' }}>
      <h1 className="logo-big" style={{ fontSize: '2rem' }}>Panel de Control</h1>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', width: '100%', maxWidth: '1000px' }}>
        <div style={{ flex: 1, background: '#18181B', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <p style={{ color: '#A1A1AA', fontSize: '0.9rem', margin: 0 }}>Volumen Negocio</p>
          <h2 className="mono" style={{ fontSize: '2rem', margin: '10px 0', color: 'white' }}>{kpis.totalFacturado.toFixed(2)}€</h2>
        </div>
        <div style={{ flex: 1, background: '#18181B', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <p style={{ color: '#A1A1AA', fontSize: '0.9rem', margin: 0 }}>Pendiente</p>
          <h2 className="mono" style={{ fontSize: '2rem', margin: '10px 0', color: '#EF4444' }}>{kpis.totalPendiente.toFixed(2)}€</h2>
        </div>
        <div style={{ flex: 1, background: '#18181B', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <p style={{ color: '#A1A1AA', fontSize: '0.9rem', margin: 0 }}>Cobrado</p>
          <h2 className="mono" style={{ fontSize: '2rem', margin: '10px 0', color: '#10B981' }}>{kpis.totalCobrado.toFixed(2)}€</h2>
        </div>
      </div>

      {/* GRÁFICA */}
      <div style={{ width: '100%', maxWidth: '1000px', height: '350px', background: '#18181B', padding: '25px', borderRadius: '12px', border: '1px solid #27272A', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Ingresos Recientes</h3>
          <span style={{ fontSize: '0.8rem', color: '#71717A' }}>Últimas 5 facturas</span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={datosGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorPendiente" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#71717A" stopOpacity={0.8}/><stop offset="95%" stopColor="#71717A" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
            <XAxis dataKey="nombre" stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 12 }} tickLine={false} axisLine={false} dy={10}/>
            <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 12 }} tickLine={false} axisLine={false} unit="€"/>
            <Tooltip cursor={{ fill: '#27272A', opacity: 0.4 }} contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(4px)', border: '1px solid #333', borderRadius: '8px', color: 'white' }} itemStyle={{ color: '#E4E4E7' }}/>
            <Bar dataKey="total" radius={[8, 8, 0, 0]} animationDuration={1500}>
              {datosGrafica.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.estado === 'Cobrado' ? 'url(#colorCobrado)' : 'url(#colorPendiente)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ZONA DE TRABAJO */}
      <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1000px', alignItems: 'flex-start' }}>
        {/* EDITOR */}
        <div style={{ flex: 2, background: '#18181B', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Editar Factura' : 'Nueva Factura'}</h3>
          <form onSubmit={guardarFactura}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div><label style={{ display:'block', fontSize:'0.7rem', color:'#71717A', marginBottom:'4px' }}>NÚMERO</label><input type="text" value={numero} onChange={e => setNumero(e.target.value)} style={{ height: '40px', width:'100%', padding: '8px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius:'4px' }} /></div>
              <div><label style={{ display:'block', fontSize:'0.7rem', color:'#71717A', marginBottom:'4px' }}>FECHA</label><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ height: '40px', width:'100%', padding: '8px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius:'4px' }} /></div>
              <div><label style={{ display:'block', fontSize:'0.7rem', color:'#71717A', marginBottom:'4px' }}>VENCIMIENTO</label><input type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)} style={{ height: '40px', width:'100%', padding: '8px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius:'4px' }} /></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display:'block', fontSize:'0.7rem', color:'#71717A', marginBottom:'4px' }}>CLIENTE</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ width:'100%', padding: '10px', background: '#09090B', color: 'white', border: '1px solid #333', borderRadius:'4px' }} required>
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                  <input placeholder="Concepto" value={item.concepto} onChange={e => handleItemChange(index, 'concepto', e.target.value)} style={{ flex: 2, padding: '5px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
                  <input type="number" placeholder="Cant" value={item.cantidad} onChange={e => handleItemChange(index, 'cantidad', Number(e.target.value))} style={{ width: '50px', padding: '5px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
                  <input type="number" placeholder="Precio" value={item.precio} onChange={e => handleItemChange(index, 'precio', Number(e.target.value))} style={{ width: '70px', padding: '5px', background: '#09090B', color: 'white', border: '1px solid #333' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={addItem} style={{ fontSize: '0.8rem', padding: '8px 12px', cursor: 'pointer', background: 'transparent', color: '#A1A1AA', border: '1px solid #333', borderRadius: '4px' }}>+ Línea Vacía</button>
                <select onChange={addProductFromCatalog} style={{ fontSize: '0.8rem', padding: '8px', cursor: 'pointer', background: '#27272A', color: 'white', border: 'none', borderRadius: '4px', outline: 'none' }} value="">
                    <option value="" disabled>Añadir Servicio Rápido...</option>
                    {productosCatalogo.map(p => <option key={p._id} value={p._id}>{p.nombre} ({p.precio}€)</option>)}
                </select>
              </div>
            </div>
            <div style={{ textAlign: 'right', borderTop: '1px solid #333', paddingTop: '10px' }}>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>Base: {totales.base.toFixed(2)}€</p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#A1A1AA' }}>IVA (21%): {totales.iva.toFixed(2)}€</p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#EF4444' }}>IRPF (15%): -{totales.irpf.toFixed(2)}€</p>
              <h2 className="mono" style={{ color: 'white', marginTop: '10px' }}>Total: {totales.total.toFixed(2)}€</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ flex: 1, padding: '15px', background: editingId ? '#EAB308' : 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{editingId ? 'GUARDAR CAMBIOS' : 'EMITIR FACTURA'}</button>
              {editingId && <button type="button" onClick={cancelarEdicion} style={{ padding: '0 20px', background: 'transparent', color: '#EF4444', fontWeight: 'bold', border: '1px solid #EF4444', borderRadius: '6px', cursor: 'pointer' }}>CANCELAR</button>}
            </div>
          </form>
        </div>

        {/* HISTORIAL */}
        <div style={{ flex: 1, background: '#09090B', padding: '20px', borderRadius: '10px', border: '1px solid #333', maxHeight: '600px', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>Historial</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setFiltroEstado('todos')} style={{ flex: 1, padding: '8px', background: filtroEstado === 'todos' ? 'white' : 'transparent', color: filtroEstado === 'todos' ? 'black' : '#71717A', border: filtroEstado === 'todos' ? 'none' : '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Todas</button>
            <button onClick={() => setFiltroEstado('pendientes')} style={{ flex: 1, padding: '8px', background: filtroEstado === 'pendientes' ? '#EF4444' : 'transparent', color: filtroEstado === 'pendientes' ? 'white' : '#71717A', border: filtroEstado === 'pendientes' ? 'none' : '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Pendientes</button>
            <button onClick={() => setFiltroEstado('pagadas')} style={{ flex: 1, padding: '8px', background: filtroEstado === 'pagadas' ? '#10B981' : 'transparent', color: filtroEstado === 'pagadas' ? 'black' : '#71717A', border: filtroEstado === 'pagadas' ? 'none' : '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Pagadas</button>
          </div>
          <button onClick={exportarCSV} style={{ width: '100%', marginBottom: '15px', padding: '10px', background: '#27272A', color: '#A1A1AA', border: '1px dashed #52525B', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Descargar Informe Excel (.csv)</button>
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: '92.5%', padding: '10px', marginBottom: '20px', background: '#18181B', border: '1px solid #333', color: 'white', borderRadius: '6px' }} />
          {facturasFiltradas.length === 0 && <p style={{color: '#666', textAlign: 'center'}}>No encontrado.</p>}
          {facturasFiltradas.map(f => (
            <div key={f._id} style={{ border: '1px solid #27272A', background: '#18181B', padding: '15px', marginBottom: '10px', borderRadius: '8px', opacity: f.pagada ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{f.numero}</strong>
                  {f.pagada && <span style={{ background: '#10B981', color: 'black', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PAGADA</span>}
                </div>
                <span className="mono" style={{ color: f.pagada ? '#10B981' : 'white', fontSize: '1.1rem' }}>{f.total.toFixed(2)}€</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#A1A1AA', marginBottom: '15px' }}>{f.cliente.nombre}</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #27272A', paddingTop: '10px' }}>
                <button onClick={() => cargarParaEditar(f)} style={{ width: '40px', background: 'transparent', border: '1px solid #EAB308', color: '#EAB308', cursor: 'pointer', borderRadius: '4px' }}>✎</button>
                <PDFDownloadLink document={<InvoicePDF factura={f} perfil={perfil} />} fileName={`Factura-${f.numero}.pdf`} style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '8px', background: '#E4E4E7', color: 'black', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{({ loading }) => (loading ? '...' : ' PDF')}</PDFDownloadLink>
                <button onClick={() => togglePagada(f._id)} style={{ flex: 1, background: 'transparent', border: '1px solid #10B981', color: '#10B981', cursor: 'pointer', borderRadius: '4px' }}>{f.pagada ? 'Deshacer' : 'Cobrar'}</button>
                <button onClick={() => borrarFactura(f._id)} style={{ width: '40px', background: '#3f1515', border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer', borderRadius: '4px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>
    </div>
  );
}

export default Dashboard;