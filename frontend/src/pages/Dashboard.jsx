import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { estadoPedidoLabel, estadoPagoLabel, money } from '../utils/labels';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="text-muted" style={{ fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

function PedidoRow({ p }) {
  const fin = p.financiero ?? {};
  return (
    <tr>
      <td><span className="fw-semibold text-muted">#{p.id_pedido}</span></td>
      <td className="fw-bold" style={{ whiteSpace: 'nowrap' }}>{p.cliente_nombre}</td>
      <td><span className={`gs-badge gs-badge-${p.estado}`}>{estadoPedidoLabel(p.estado)}</span></td>
      <td className="fw-bold">{money(fin.total_venta ?? 0)}</td>
      <td><span className={`gs-badge gs-badge-${fin.estado_pago ?? 'sin_pago'}`}>{estadoPagoLabel(fin.estado_pago ?? 'sin_pago')}</span></td>
      <td className="text-muted small">{new Date(p.fecha_creacion).toLocaleDateString('es-CL')}</td>
    </tr>
  );
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/pedidos'), api.get('/alertas/stock')])
      .then(([resPedidos, resAlertas]) => {
        const all = resPedidos.data;
        const pendientes  = all.filter(p => p.estado === 'pendiente');
        const completados = all.filter(p => p.estado === 'completado');
        const totalVentas = completados.reduce((a, p) => a + Number(p.financiero?.total_venta ?? 0), 0);
        const totalMargen = completados.reduce((a, p) => a + Number(p.financiero?.margen ?? 0), 0);
        setStats({ pendientes: pendientes.length, completados: completados.length, totalVentas, totalMargen });
        setPedidos(all.slice(0, 8));
        setAlertas(resAlertas.data);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout alertasCount={0}>
        <div className="loading-screen">
          <div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} />
          Cargando…
        </div>
      </Layout>
    );
  }

  return (
    <Layout alertasCount={alertas.length}>
      <div className="page-header">
        <h1 className="page-header-title">Dashboard</h1>
        <div className="text-muted small">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📬" label="Pedidos pendientes" value={stats?.pendientes ?? 0} />
          <StatCard icon="✅" label="Completados (total)" value={stats?.completados ?? 0} />
          <StatCard icon="💰" label="Ventas completadas"
            value={money(stats?.totalVentas ?? 0)}
            color="var(--clr-success)" />
          <StatCard icon="📈" label="Margen total"
            value={money(stats?.totalMargen ?? 0)}
            color="var(--clr-pink-dim)" />
          {alertas.length > 0 && (
            <StatCard icon="⚠️" label="Alertas de stock"
              value={alertas.length} sub="materiales bajo mínimo"
              color="var(--clr-danger)" />
          )}
        </div>

        <div className="dashboard-grid">
          {/* Pedidos recientes */}
          <div>
            <div className="section-title">📦 Pedidos recientes</div>
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th><th>Cliente</th><th>Estado</th>
                    <th>Total</th><th>Pago</th><th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.length === 0
                    ? <tr><td colSpan={6} className="table-empty">Sin pedidos aún</td></tr>
                    : pedidos.map(p => <PedidoRow key={p.id_pedido} p={p} />)
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas de stock */}
          <div>
            <div className="section-title">🚨 Stock bajo mínimo</div>
            {alertas.length === 0
              ? <div className="alert alert-success">✅ Todo el stock está en orden</div>
              : (
                <div className="d-flex flex-column gap-3">
                  {alertas.map(m => {
                    const pct = Math.min(100, Math.round((Number(m.stock_actual) / Math.max(Number(m.stock_minimo), 1)) * 100));
                    return (
                      <div key={m.id_material} className="card-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small">{m.nombre}</span>
                          <span className="gs-badge gs-badge-alerta">⚠ Stock bajo</span>
                        </div>
                        <div className="stock-bar-wrapper">
                          <div className="d-flex justify-content-between" style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>
                            <span>Actual: {Math.round(Number(m.stock_actual))} {m.unidad_medida}</span>
                            <span>Min: {Math.round(Number(m.stock_minimo))}</span>
                          </div>
                          <div className="stock-bar-track">
                            <div className="stock-bar-fill stock-bar-danger" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </Layout>
  );
}
