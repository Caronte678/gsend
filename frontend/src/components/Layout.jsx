import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

const NAV_ITEMS = [
  { to: '/',             icon: '⬡',  label: 'Dashboard' },
  { to: '/pedidos',      icon: '📦', label: 'Pedidos' },
  { to: '/productos',    icon: '🏷️',  label: 'Productos' },
  { to: '/materiales',   icon: '🧮', label: 'Materiales' },
  { to: '/inventario',   icon: '📊', label: 'Inventario' },
];

export default function Layout({ children, alertasCount = 0 }) {
  const { logout }  = useAuth();
  const { config }  = useConfig();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar el drawer al navegar entre páginas (en móvil).
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  function handleLogout() { logout(); navigate('/login'); }

  const nombrePyme = config.nombre_pyme || 'Mi Pyme';

  return (
    <div className="app-shell">
      {/* ── Barra superior (solo móvil) ── */}
      <header className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
        <span className="mobile-topbar-title">{nombrePyme}</span>
        {alertasCount > 0 && <span className="nav-badge">{alertasCount}</span>}
      </header>

      {/* Fondo oscuro al abrir el drawer en móvil */}
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>

        {/* Logo / nombre pyme */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            {config.logo_base64
              ? <img
                  src={config.logo_base64}
                  alt="logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
                />
              : '✦'
            }
          </div>
          <span className="sidebar-logo-text" title={nombrePyme}>
            {nombrePyme}
          </span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Principal</span>

          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">{icon}</span>
              {label}
              {label === 'Inventario' && alertasCount > 0 && (
                <span className="nav-badge">{alertasCount}</span>
              )}
            </NavLink>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: '1rem' }}>Ajustes</span>
          <NavLink
            to="/configuracion"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-link-icon">⚙️</span>
            Configuracion
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Admin</div>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
