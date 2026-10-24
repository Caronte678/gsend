import { useState } from 'react';
import api from '../services/api';
import { qty } from '../utils/labels';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };

// Corrige el stock a la cantidad contada (error de carga, conteo de inventario).
// A diferencia de Reponer, puede bajar el stock y no cambia el costo unitario;
// la diferencia queda registrada como movimiento de ajuste.
export default function AjustarStockModal({ material, onClose, onSaved }) {
  const [form, setForm]       = useState({ stock_real: '', motivo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function set(f, v) { setForm(x => ({ ...x, [f]: v })); }

  const actual     = Number(material.stock_actual);
  const real       = parseFloat(form.stock_real);
  const diferencia = Number.isFinite(real) ? Math.round((real - actual) * 1e4) / 1e4 : null;

  async function handleSubmit(e) {
    e.preventDefault(); setError(null);
    if (!Number.isFinite(real) || real < 0) { setError('Ingresá la cantidad real (0 o más).'); return; }
    if (diferencia === 0) { setError('El stock ya es esa cantidad: no hay nada que ajustar.'); return; }

    setLoading(true);
    try {
      await api.post(`/materiales/${material.id_material}/ajustar`, {
        stock_real: real,
        motivo: form.motivo || undefined,
      });
      onSaved();
    } catch (err) { setError(err.response?.data?.error ?? 'Error al ajustar el stock'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal show d-block" tabIndex="-1" onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div onClick={onClose} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Ajustar stock &mdash; {material.nombre}</h5>
            <button className="btn-close" onClick={onClose} aria-label="Cerrar" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2">&#9888; {error}</div>}
              <div className="alert alert-info py-2 mb-0">
                El sistema dice que hay: <strong>{qty(actual)} {material.unidad_medida}</strong>
              </div>
              <div>
                <label className="form-label" htmlFor="ajuste-real">Cantidad real *</label>
                <input id="ajuste-real" className="form-control" type="number" min="0" step="any" autoFocus
                  value={form.stock_real} onChange={e => set('stock_real', e.target.value)}
                  required placeholder="Lo que contaste" />
                {diferencia !== null && diferencia !== 0 && (
                  <div className="form-text">
                    {diferencia > 0
                      ? `Se sumarán ${qty(diferencia)} ${material.unidad_medida}.`
                      : `Se restarán ${qty(-diferencia)} ${material.unidad_medida}.`}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="ajuste-motivo">Motivo (opcional)</label>
                <input id="ajuste-motivo" className="form-control" value={form.motivo} maxLength={180}
                  onChange={e => set('motivo', e.target.value)}
                  placeholder="Ej: error de carga, conteo de inventario, merma" />
              </div>
              <p className="text-muted small mb-0">
                El costo unitario no cambia. Para registrar una compra usá "Reponer".
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Ajustando...</> : 'Ajustar stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
