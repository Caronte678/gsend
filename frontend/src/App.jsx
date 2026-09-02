import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { ToastProvider } from './context/ToastContext';
import ConexionBanner from './components/ConexionBanner';

import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Pedidos        from './pages/Pedidos';
import NuevoPedido    from './pages/NuevoPedido';
import DetallePedido  from './pages/DetallePedido';
import Productos      from './pages/Productos';
import Materiales     from './pages/Materiales';
import Inventario     from './pages/Inventario';
import Configuracion  from './pages/Configuracion';

function RutaPrivada({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <ToastProvider>
        <ConexionBanner />
        <BrowserRouter>
          <Routes>
            {/* Publica */}
            <Route path="/login" element={<Login />} />

            {/* Privadas */}
            <Route path="/"               element={<RutaPrivada><Dashboard /></RutaPrivada>} />
            <Route path="/pedidos"        element={<RutaPrivada><Pedidos /></RutaPrivada>} />
            <Route path="/pedidos/nuevo"  element={<RutaPrivada><NuevoPedido /></RutaPrivada>} />
            <Route path="/pedidos/:id"    element={<RutaPrivada><DetallePedido /></RutaPrivada>} />
            <Route path="/productos"      element={<RutaPrivada><Productos /></RutaPrivada>} />
            <Route path="/materiales"     element={<RutaPrivada><Materiales /></RutaPrivada>} />
            <Route path="/inventario"     element={<RutaPrivada><Inventario /></RutaPrivada>} />
            <Route path="/configuracion"  element={<RutaPrivada><Configuracion /></RutaPrivada>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
