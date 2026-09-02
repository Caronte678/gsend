import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { ESTADO_PEDIDO_LABELS as LABELS, estadoPagoLabel, money } from '../utils/labels';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };
const ESTADOS = ['pendiente', 'confirmado', 'completado', 'cancelado'];

function EstadoModal({ pedido, onClose, onSaved }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fin           = pedido.financiero ?? {};
  const estadoPago    = fin.estado_pago ?? 'sin_pago';
  const saldoPendiente = Math.max(0, Number(fin.total_venta ?? 0) - Number(fin.total_pagado ?? 0));

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api.patch(`/pedidos/${pedido.id_pedido}/estado`, { estado });
      onSaved();
    } catch (err) {
      const msg     = err.response?.data?.error ?? 'Error al cambiar estado';
      const detalle = err.response?.data?.detalle;
      setError(detalle
        ? `${msg}: ${detalle.map(d => `${d.material} (tiene ${Math.round(d.stock_actual)}, necesita ${Math.round(d.requerido)})`).join(', ')}`
        : msg
      );
    } finally { setLoading(false); }
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div onClick={onClose} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Cambiar estado &mdash; Pedido #{pedido.id_pedido}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2 small">&#9888; {error}</div>}
              {estado === 'completado' && (
                <div className="alert alert-warning py-2 small mb-0">
                  Al completar el pedido se descontara el inventario automaticamente.
                </div>
              )}
              {estado === 'completado' && estadoPago !== 'pagado' && (
                <div className="alert alert-warning py-2 small mb-0">
                  &#9888; {estadoPago === 'parcial'
                    ? `Este pedido tiene un saldo pendiente de ${money(saldoPendiente)}.`
                    : 'Este pedido no tiene ningun pago registrado.'}
                  {' '}Podes completarlo igual, pero quedara marcado como <strong>impago</strong>.
                </div>
              )}
              <div>
                <label className="form-label">Nuevo estado</label>
                <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
                  {ESTADOS.map(e => <option key={e} value={e}>{LABELS[e]}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</> : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Pedidos() {
  const [pedidos, setPedidos]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [search, setSearch]             = useState('');
  const [modal, setModal]               = useState(null);
  const [aEliminar, setAEliminar]       = useState(null);   // pedido pendiente de confirmar borrado
  const [eliminando, setEliminando]     = useState(false);
  const [eliminarError, setEliminarError] = useState(null);
  const navigate                        = useNavigate();
  const toast                           = useToast();

  async function cargar() {
    setLoading(true);
    try {
      const params = filtroEstado ? `?estado=${filtroEstado}` : '';
      const { data } = await api.get(`/pedidos${params}`);
      setPedidos(data);
    } catch {/**/} finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [filtroEstado]);

  async function confirmarEliminar() {
    const p = aEliminar;
    setEliminando(true); setEliminarError(null);
    try {
      await api.delete(`/pedidos/${p.id_pedido}`);
      setAEliminar(null);
      toast.ok(`Pedido #${p.id_pedido} eliminado`);
      cargar();
    } catch (err) {
      setEliminarError(err.response?.data?.error ?? 'No se pudo eliminar el pedido');
    } finally { setEliminando(false); }
  }

  const filtrados = pedidos.filter(p =>
    p.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id_pedido).includes(search)
  );

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-header-title">Pedidos</h1>
        <div className="page-header-actions">
          <button id="btn-nuevo-pedido" className="btn btn-primary btn-sm" onClick={() => navigate('/pedidos/nuevo')}>
            + Nuevo pedido
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="gs-tabs">
          <button className={`gs-tab-btn${filtroEstado === '' ? ' active' : ''}`} onClick={() => setFiltroEstado('')}>Todos</button>
          {ESTADOS.map(e => (
            <button key={e} className={`gs-tab-btn${filtroEstado === e ? ' active' : ''}`} onClick={() => setFiltroEstado(e)}>
              {LABELS[e]}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div className="search-bar">
            <span className="search-bar-icon">&#128269;</span>
            <input id="search-pedidos" className="form-control form-control-sm" placeholder="Buscar por cliente o #..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-muted small">{filtrados.length} pedidos</span>
        </div>

        {loading
          ? <div className="loading-screen"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} /> Cargando...</div>
          : (
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th><th>Cliente</th><th>Estado</th>
                    <th>Items</th><th>Total</th><th>Pago</th><th>Fecha</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0
                    ? <tr><td colSpan={8} className="table-empty">Sin pedidos encontrados</td></tr>
                    : filtrados.map(p => {
                      const fin = p.financiero ?? {};
                      return (
                        <tr key={p.id_pedido}>
                          <td className="text-muted small">#{p.id_pedido}</td>
                          <td>
                            <div className="fw-bold">{p.cliente_nombre}</div>
                            {p.cliente_contacto && <div className="text-muted" style={{ fontSize: 11 }}>{p.cliente_contacto}</div>}
                          </td>
                          <td><span className={`gs-badge gs-badge-${p.estado}`}>{LABELS[p.estado]}</span></td>
                          <td className="text-muted small">{p.items?.length ?? 0} item{p.items?.length !== 1 ? 's' : ''}</td>
                          <td className="fw-bold">{money(fin.total_venta ?? 0)}</td>
                          <td>
                            <div className="d-flex flex-column" style={{ gap: 2 }}>
                              <span className={`gs-badge gs-badge-${fin.estado_pago ?? 'sin_pago'}`}>{estadoPagoLabel(fin.estado_pago ?? 'sin_pago')}</span>
                              {fin.estado_pago === 'parcial' && <span className="text-muted" style={{ fontSize: 10 }}>{money(fin.total_pagado ?? 0)} pagado</span>}
                              {p.estado === 'completado' && (fin.estado_pago ?? 'sin_pago') !== 'pagado' && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--clr-danger)' }}>&#9888; entregado sin cobrar</span>
                              )}
                            </div>
                          </td>
                          <td className="text-muted small">{new Date(p.fecha_creacion).toLocaleDateString('es-AR')}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/pedidos/${p.id_pedido}`)}>Ver</button>
                              <button className="btn btn-outline-secondary btn-sm" onClick={() => setModal({ type: 'estado', pedido: p })}>Estado</button>
                              {p.estado === 'pendiente' && <button className="btn btn-danger btn-sm" onClick={() => { setEliminarError(null); setAEliminar(p); }}>Quitar</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {modal?.type === 'estado' && (
        <EstadoModal pedido={modal.pedido} onClose={() => setModal(null)} onSaved={() => { setModal(null); cargar(); }} />
      )}

      {aEliminar && (
        <ConfirmModal
          title="Eliminar pedido"
          message={`El pedido #${aEliminar.id_pedido} de ${aEliminar.cliente_nombre} y sus pagos se eliminarán de forma permanente. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          variant="danger"
          loading={eliminando}
          error={eliminarError}
          onConfirm={confirmarEliminar}
          onClose={() => { setAEliminar(null); setEliminarError(null); }}
        />
      )}
    </Layout>
  );
}
