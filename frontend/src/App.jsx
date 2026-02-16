import { useState, useEffect } from "react"; // Importaciones necesarias
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Para rutas
import { Toaster } from "sonner"; // Para notificaciones
import Sidebar from "./components/Sidebar"; // Sidebar de navegación
import Dashboard from "./pages/Dashboard"; // Página principal
import ClientsPage from "./pages/ClientsPage"; // Página de clientes
import SettingsPage from "./pages/SettingsPage"; // Página de ajustes
import ProductsPage from "./pages/ProductsPage"; // Página de productos/servicios
import LoginPage from "./pages/LoginPage"; // Página de login
import RegisterPage from "./pages/RegisterPage"; // Página de registro
import ExpensesPage from "./pages/ExpensesPage"; // Página de gastos
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Ahora comprobamos si existe el TOKEN real, no solo un booleano
    const token = localStorage.getItem("invoice_token");
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("invoice_token"); // Borramos el token real
    localStorage.removeItem("invoice_auth"); // (Limpieza del sistema anterior)
    setIsAuthenticated(false);
  };

  // Zona de los no logueados
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

  // Zona de los logueados
  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: "#09090B",
        }}
      >
        <Sidebar onLogout={handleLogout} />

        <div
          style={{
            flex: 1,
            height: "100%",
            overflow: "hidden",
            background: "#09090B",
            color: "#E4E4E7",
            position: "relative",
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/gastos" element={<ExpensesPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
      <Toaster richColors theme="dark" position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;
