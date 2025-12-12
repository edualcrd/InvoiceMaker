
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ onLogout }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/productos', label: 'Servicios' },
    { path: '/clientes', label: 'Clientes' },
    { path: '/gastos', label: 'Gastos' },
    { path: '/ajustes', label: 'Ajustes' },
  ];

  return (
    <div style={{ 
      width: '250px', 
      background: '#09090B', 
      borderRight: '1px solid #333', 
      height: '100vh', 
      boxSizing: 'border-box',
      padding: '20px',
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      
      <h2 style={{ color: 'white', marginTop: 0, marginBottom: '40px' }}>
        InvoiceMaker
      </h2>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ 
                textDecoration: 'none', 
                color: isActive ? 'white' : '#A1A1AA', 
                background: isActive ? '#27272A' : 'transparent', 
                padding: '12px', 
                borderRadius: '6px', 
                display: 'flex', 
                gap: '10px', 
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Margen automático arriba para empujar esto al fondo */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <button 
          onClick={onLogout}
          style={{ 
            width: '100%', 
            background: 'transparent', 
            border: '1px solid #EF4444', 
            color: '#EF4444', 
            padding: '12px',
            borderRadius: '6px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            fontSize: '0.9rem'
          }}
        >
          <span></span> Cerrar Sesión
        </button>

        <p style={{ color: '#52525B', fontSize: '0.75rem', textAlign: 'center', marginTop: '15px' }}>v1.0.0 Stable</p>
      </div>
    </div>
  );
}

export default Sidebar;