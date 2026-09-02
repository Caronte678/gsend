import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ── Bootstrap + tema personalizado bykary.design ──────────────────
// ORDEN CRÍTICO (el que carga último gana en la cascada CSS):
// 1. Bootstrap base — estilos por defecto
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Nuestro tema — sobreescribe TODOS los colores de Bootstrap
import './styles/bootstrap-theme.css';
// 3. Componentes propios (sidebar, stock bars, login, etc.)
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
