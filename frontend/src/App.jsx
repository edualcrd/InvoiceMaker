// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import ProductsPage from './pages/ProductsPage'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // <--- IMPORTADO

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // <--- NUEVO ESTADO

  useEffect(() => {
    // Ahora comprobamos si existe el TOKEN real, no solo un booleano
    const token = localStorage.getItem('invoice_token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('invoice_token'); // Borramos el token real
    localStorage.removeItem('invoice_auth');  // (Limpieza del sistema anterior)
    setIsAuthenticated(false);
  };

  // --- ZONA DE NO LOGUEADOS ---
  if (!isAuthenticated) {
    return (
      <>
        {/* Si está registrándose, mostramos RegisterPage. Si no, LoginPage */}
        {isRegistering ? (
          <RegisterPage onSwitchToLogin={() => setIsRegistering(false)} />
        ) : (
          <LoginPage 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setIsRegistering(true)} 
          />
        )}
        <Toaster richColors theme="dark" position="bottom-right" />
      </>
    );
  }

  // --- ZONA DE LOGUEADOS (APP) ---
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#09090B' }}>
        
        <Sidebar onLogout={handleLogout} />

        <div style={{ flex: 1, height: '100%', overflow: 'hidden', background: '#09090B', color: '#E4E4E7', position: 'relative' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

      </div>
      <Toaster richColors theme="dark" position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;