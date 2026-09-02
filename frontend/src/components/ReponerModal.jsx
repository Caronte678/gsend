import { useState } from 'react';
import api from '../services/api';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };

// Modal de reposición de stock, compartido por Materiales e Inventario
// (antes había dos copias con validaciones distintas).
export default function ReponerModal({ material, onClose, onSaved }) {
  const [form, setForm]       = useState({ cantidad: '', costo_unitario: '', motivo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function set(f, v) { setForm(x => ({ ...x, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api.post(`/materiales/${material.id_material}/reponer`, {
        cantidad: parseFloat(form.cantidad),
        costo_unitario: parseFloat(form.costo_unitario),
        motivo: form.motivo || undefined,
      });
      onSaved();
    } catch (err) { setError(err.response?.data?.error ?? 'Error al reponer'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal show d-block" tabIndex="-1" onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div onClick={onClose} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reponer stock &mdash; {material.nombre}</h5>
            <button className="btn-close" onClick={onClose} aria-label="Cerrar" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2">&#9888; {error}</div>}
              <div className="alert alert-info py-2 mb-0">
                Stock actual: <strong>{Math.round(Number(material.stock_actual))} {material.unidad_medida}</strong>
              </div>
              <div className="row g-3">
                <div className="col">
                  <label className="form-label">Cantidad a ingresar *</label>
                  <input className="form-control" type="number" min="0.01" step="0.01" autoFocus
                    value={form.cantidad} onChange={e => set('cantidad', e.target.value)}
                    required placeholder="0.00" />
                </div>
                <div className="col">
                  <label className="form-label">Costo unitario ($) *</label>
                  <input className="form-control" type="number" min="0" step="0.01"
                    value={form.costo_unitario} onChange={e => set('costo_unitario', e.target.value)}
                    required placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="form-label">Motivo (opcional)</label>
                <input className="form-control" value={form.motivo}
                  onChange={e => set('motivo', e.target.value)}
                  placeholder="Ej: Compra en mayorista" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Registrando...</> : 'Registrar ingreso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
