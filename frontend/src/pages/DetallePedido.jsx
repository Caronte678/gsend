import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { ESTADO_PEDIDO_LABELS as LABELS, estadoPagoLabel, money } from '../utils/labels';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };

function PagoModal({ pedidoId, saldo, onClose, onSaved }) {
  const [form, setForm]   = useState({ monto: String(saldo ?? ''), metodo_pago: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault(); setError(null);

    const monto = parseFloat(form.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresá un monto mayor a 0.');
      return;
    }
    if (monto > saldo + 0.01) {
      setError(`El monto supera el saldo pendiente (${money(saldo)}).`);
      return;
    }

    setLoading(true);
    try {
      await api.post(`/pedidos/${pedidoId}/pagos`, { monto, metodo_pago: form.metodo_pago || undefined });
      onSaved();
    } catch (err) { setError(err.response?.data?.error ?? 'Error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div onClick={onClose} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Registrar pago</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2">&#9888; {error}</div>}
              <div className="alert alert-info py-2 mb-0">
                Saldo pendiente: <strong>{money(saldo)}</strong>
              </div>
              <div>
                <label className="form-label" htmlFor="pago-monto">Monto ($) *</label>
                <input id="pago-monto" className="form-control" type="number" min="0.01" step="0.01"
                  max={saldo} autoFocus
                  value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  required placeholder="0.00" />
                <div className="form-text">
                  Prellenado con el saldo total. Cambialo si el pago es parcial.
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="pago-metodo">Metodo de pago</label>
                <input id="pago-metodo" className="form-control" value={form.metodo_pago} onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))} placeholder="Efectivo, transferencia, MP..." />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Registrando...</> : 'Registrar pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DetallePedido() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showPago, setShowPago] = useState(false);

  async function cargar() {
    setLoading(true);
    try { const { data } = await api.get(`/pedidos/${id}`); setPedido(data); }
    catch { navigate('/pedidos'); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [id]);

  if (loading || !pedido) {
    return <Layout><div className="loading-screen"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} /> Cargando...</div></Layout>;
  }

  const fin = pedido.financiero ?? {};
  const saldo = Math.max(0, Number(fin.total_venta ?? 0) - Number(fin.total_pagado ?? 0));

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-header-title">Pedido #{pedido.id_pedido}</h1>
        <div className="page-header-actions">
          <span className={`gs-badge gs-badge-${pedido.estado}`}>{LABELS[pedido.estado]}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/pedidos')}>Volver</button>
        </div>
      </div>

      <div className="page-body">
        <div className="dashboard-grid">
          <div className="d-flex flex-column gap-4">
            {/* Cliente */}
            <div className="card p-4">
              <div className="section-title">Cliente</div>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Nombre</span>
                  <span className="fw-bold">{pedido.cliente_nombre}</span>
                </div>
                {pedido.cliente_contacto && (
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Contacto</span>
                    <span>{pedido.cliente_contacto}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Fecha</span>
                  <span>{new Date(pedido.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                {pedido.notas && (
                  <div className="pt-2 mt-1" style={{ borderTop: '1px solid var(--clr-border-soft)' }}>
                    <div className="text-muted small mb-1">Notas</div>
                    <div className="small">{pedido.notas}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="card p-4">
              <div className="section-title">Productos</div>
              <div className="table-wrapper">
                <table className="table table-hover mb-0">
                  <thead><tr><th>Producto</th><th>Cant.</th><th>P. unitario</th><th>Subtotal</th><th>Atributos</th></tr></thead>
                  <tbody>
                    {pedido.items.map(item => (
                      <tr key={item.id_item}>
                        <td className="fw-bold">{item.producto?.nombre}</td>
                        <td>{item.cantidad}</td>
                        <td>{money(item.precio_venta_unitario)}</td>
                        <td className="fw-bold">{money(item.cantidad * Number(item.precio_venta_unitario))}</td>
                        <td className="text-muted small">
                          {item.valores?.length > 0
                            ? item.valores.map(v => `${v.atributo?.nombre}: ${v.valor}`).join(', ')
                            : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column gap-4">
            {/* Finanzas */}
            <div className="card p-4">
              <div className="section-title">Finanzas</div>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Total venta</span>
                  <span className="fw-bold" style={{ fontSize: '1.1rem' }}>{money(fin.total_venta ?? 0)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    Costo materiales
                    {fin.costo_estimado && <span className="text-muted" style={{ fontSize: 10 }}> (estimado)</span>}
                  </span>
                  <span style={{ color: 'var(--clr-danger)' }}>{money(fin.costo_total ?? 0)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--clr-border-soft)' }}>
                  <span className="text-muted small">Margen{fin.costo_estimado && <span className="text-muted" style={{ fontSize: 10 }}> (estimado)</span>}</span>
                  <span className="fw-bold" style={{ color: 'var(--clr-success)' }}>{money(fin.margen ?? 0)}</span>
                </div>
              </div>
              {fin.costo_estimado && (
                <p className="text-muted mb-0 mt-2" style={{ fontSize: 11 }}>
                  El costo se estima con la receta actual. Al completar el pedido se registra el costo real del inventario descontado.
                </p>
              )}
            </div>

            {/* Pagos */}
            <div className="card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="section-title mb-0">Pagos</div>
                {pedido.estado !== 'cancelado' && saldo > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPago(true)}>+ Registrar pago</button>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded-3" style={{ background: 'var(--clr-surface-2)' }}>
                <span className="small text-muted">Estado de pago</span>
                <span className={`gs-badge gs-badge-${fin.estado_pago ?? 'sin_pago'}`}>{estadoPagoLabel(fin.estado_pago ?? 'sin_pago')}</span>
              </div>

              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between"><span className="text-muted small">Total pagado</span><span className="fw-bold">{money(fin.total_pagado ?? 0)}</span></div>
                <div className="d-flex justify-content-between"><span className="text-muted small">Saldo pendiente</span><span className="fw-bold" style={{ color: saldo > 0 ? 'var(--clr-warning)' : 'var(--clr-success)' }}>{money(saldo)}</span></div>
              </div>

              {pedido.pagos?.length > 0 && (
                <div className="table-wrapper mt-3">
                  <table className="table mb-0">
                    <thead><tr><th>Fecha</th><th>Monto</th><th>Metodo</th></tr></thead>
                    <tbody>
                      {pedido.pagos.map(pg => (
                        <tr key={pg.id_pago}>
                          <td className="text-muted small">{new Date(pg.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="fw-bold">{money(pg.monto)}</td>
                          <td className="text-muted small">{pg.metodo_pago ?? '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPago && (
        <PagoModal pedidoId={pedido.id_pedido} saldo={saldo} onClose={() => setShowPago(false)} onSaved={() => { setShowPago(false); cargar(); }} />
      )}
    </Layout>
  );
}
