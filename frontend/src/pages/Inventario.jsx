import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReponerModal from '../components/ReponerModal';
import { moneyUnit } from '../utils/labels';
import api from '../services/api';

export default function Inventario() {
  const [materiales, setMateriales] = useState([]);
  const [alertas, setAlertas]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('stock');
  const [reponerModal, setReponerModal] = useState(null);

  async function cargar() {
    setLoading(true);
    try {
      const [mats, alts] = await Promise.all([api.get('/materiales'), api.get('/alertas/stock')]);
      setMateriales(mats.data);
      setAlertas(alts.data);
    } catch {/**/} finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  // Porcentaje para el ancho de la barra (capped a 100%)
  function getStockPct(m) {
    const min = Number(m.stock_minimo);
    if (min === 0) return 100;
    return Math.min(100, Math.round((Number(m.stock_actual) / min) * 100));
  }

  // Color de la barra basado en stock REAL vs mínimo (no en el pct capped)
  function getBarClass(m) {
    const actual = Number(m.stock_actual);
    const minimo = Number(m.stock_minimo);
    if (actual < minimo * 0.5) return 'stock-bar-danger';
    if (actual < minimo)       return 'stock-bar-warning';
    return 'stock-bar-ok';
  }

  // True solo si el stock real está por debajo del mínimo
  function esBajoMinimo(m) {
    return Number(m.stock_actual) < Number(m.stock_minimo);
  }

  const activos = materiales.filter(m => m.activo);

  return (
    <Layout alertasCount={alertas.length}>
      <div className="page-header">
        <h1 className="page-header-title">Inventario</h1>
        {alertas.length > 0 && (
          <span className="gs-badge gs-badge-alerta">&#9888; {alertas.length} bajo minimo</span>
        )}
      </div>

      <div className="page-body">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link${tab === 'stock' ? ' active' : ''}`} onClick={() => setTab('stock')}>
              Stock general
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link${tab === 'alertas' ? ' active' : ''}`} onClick={() => setTab('alertas')}>
              Alertas
              {alertas.length > 0 && (
                <span className="badge bg-danger ms-2" style={{ fontSize: 10 }}>{alertas.length}</span>
              )}
            </button>
          </li>
        </ul>

        {loading
          ? <div className="loading-screen"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} /> Cargando...</div>
          : tab === 'stock'
            ? (
              <div className="d-flex flex-column gap-3">
                {activos.length === 0
                  ? <div className="alert alert-info">No hay materiales activos registrados.</div>
                  : activos.map(m => {
                    const pct  = getStockPct(m);
                    const bajo = esBajoMinimo(m);
                    return (
                      <div key={m.id_material} className="card-sm">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div className="fw-bold">{m.nombre}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {m.unidad_medida} &middot; Costo: {moneyUnit(m.costo_unitario_actual)}
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {bajo
                              ? <span className="gs-badge gs-badge-alerta">Stock bajo</span>
                              : <span className="gs-badge gs-badge-ok">OK</span>
                            }
                            <button className="btn btn-outline-secondary btn-sm"
                              onClick={() => setReponerModal(m)}>Reponer</button>
                          </div>
                        </div>
                        <div className="stock-bar-wrapper">
                          <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: 12 }}>
                            <span>Actual: <strong>{Math.round(Number(m.stock_actual))}</strong></span>
                            <span>Minimo: {Math.round(Number(m.stock_minimo))}</span>
                          </div>
                          <div className="stock-bar-track">
                            <div className={`stock-bar-fill ${getBarClass(m)}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )
            : (
              alertas.length === 0
                ? <div className="alert alert-success">Todo el stock esta por encima del minimo configurado.</div>
                : (
                  <div className="d-flex flex-column gap-3">
                    {alertas.map(m => (
                      <div key={m.id_material} className="card-sm"
                        style={{ borderColor: 'rgba(217,110,110,0.4)' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold" style={{ color: 'var(--clr-danger)' }}>{m.nombre}</div>
                            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                              Stock actual: <strong>{Math.round(Number(m.stock_actual))} {m.unidad_medida}</strong>
                              {' '}/ Minimo: {Math.round(Number(m.stock_minimo))}
                            </div>
                          </div>
                          <button className="btn btn-primary btn-sm" onClick={() => setReponerModal(m)}>
                            Reponer ahora
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )
        }
      </div>

      {reponerModal && (
        <ReponerModal
          material={reponerModal}
          onClose={() => setReponerModal(null)}
          onSaved={() => { setReponerModal(null); cargar(); }}
        />
      )}
    </Layout>
  );
}
