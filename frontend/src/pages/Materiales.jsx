import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReponerModal from '../components/ReponerModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { moneyUnit } from '../utils/labels';
import api from '../services/api';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };

function MaterialModal({ material, onClose, onSaved }) {
  const editing = Boolean(material?.id_material);
  const [form, setForm] = useState({
    nombre: material?.nombre ?? '',
    unidad_medida: material?.unidad_medida ?? '',
    stock_minimo: material?.stock_minimo ?? 0,
    stock_actual: material?.stock_actual ?? 0,
    costo_unitario_actual: material?.costo_unitario_actual ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(f, v) { setForm(x => ({ ...x, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (editing) await api.put(`/materiales/${material.id_material}`, form);
      else await api.post('/materiales', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error ?? 'Error al guardar'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div onClick={onClose} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editing ? 'Editar material' : 'Nuevo material'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2">&#9888; {error}</div>}
              <div>
                <label className="form-label" htmlFor="mat-nombre">Nombre *</label>
                <input id="mat-nombre" className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Papel A4 80g" />
              </div>
              <div>
                <label className="form-label" htmlFor="mat-um">Unidad de medida *</label>
                <input id="mat-um" className="form-control" value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)} required placeholder="Ej: hojas, metros, unidades" />
              </div>
              <div className="row g-3">
                <div className="col">
                  <label className="form-label">Stock actual</label>
                  <input className="form-control" type="number" min="0" step="1"
                    value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)} disabled={editing} />
                </div>
                <div className="col">
                  <label className="form-label">Stock minimo</label>
                  <input className="form-control" type="number" min="0" step="1"
                    value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
                </div>
                <div className="col">
                  <label className="form-label">Costo ($)</label>
                  <input className="form-control" type="number" min="0" step="0.01" value={form.costo_unitario_actual} onChange={e => set('costo_unitario_actual', e.target.value)} disabled={editing} />
                </div>
              </div>
              {editing && <p className="text-muted small mb-0">Para modificar stock o costo usa "Reponer".</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</> : (editing ? 'Guardar cambios' : 'Crear material')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Materiales() {
  const [materiales, setMateriales]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [verInactivos, setVerInactivos]   = useState(false);
  const [modal, setModal]                 = useState(null);
  const [aDesactivar, setADesactivar]     = useState(null);
  const [desactivando, setDesactivando]   = useState(false);
  const [desactivarError, setDesactivarError] = useState(null);
  const toast = useToast();

  async function cargar() {
    setLoading(true);
    try { const { data } = await api.get('/materiales'); setMateriales(data); }
    catch {/**/} finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function confirmarDesactivar() {
    const m = aDesactivar;
    setDesactivando(true); setDesactivarError(null);
    try {
      await api.put(`/materiales/${m.id_material}`, { activo: false });
      setADesactivar(null);
      toast.ok(`«${m.nombre}» desactivado`);
      cargar();
    } catch (err) {
      setDesactivarError(err.response?.data?.error ?? 'No se pudo desactivar el material');
    } finally { setDesactivando(false); }
  }

  async function reactivar(m) {
    try {
      await api.put(`/materiales/${m.id_material}`, { activo: true });
      toast.ok(`«${m.nombre}» reactivado`);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo reactivar el material');
    }
  }

  const filtrados = materiales.filter(m =>
    (verInactivos || m.activo) &&
    m.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const stockBajo = materiales.filter(m => m.activo && Number(m.stock_actual) < Number(m.stock_minimo)).length;

  function getStockStyle(m) {
    const pct = Number(m.stock_actual) / Math.max(Number(m.stock_minimo), 1);
    if (pct <= 0.3) return { color: 'var(--clr-danger)', fontWeight: 600 };
    if (pct <= 1)   return { color: 'var(--clr-warning)', fontWeight: 600 };
    return {};
  }

  return (
    <Layout alertasCount={stockBajo}>
      <div className="page-header">
        <h1 className="page-header-title">Materiales</h1>
        <div className="page-header-actions">
          <button id="btn-nuevo-material" className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'create' })}>
            + Nuevo material
          </button>
        </div>
      </div>

      <div className="page-body">
        {stockBajo > 0 && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
            &#9888; {stockBajo} material{stockBajo > 1 ? 'es' : ''} con stock por debajo del minimo
          </div>
        )}

        <div className="toolbar">
          <div className="search-bar">
            <span className="search-bar-icon">&#128269;</span>
            <input id="search-materiales" className="form-control form-control-sm" placeholder="Buscar material..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="ver-inactivos-mat"
              checked={verInactivos} onChange={e => setVerInactivos(e.target.checked)} />
            <label className="form-check-label small text-muted" htmlFor="ver-inactivos-mat">Ver inactivos</label>
          </div>
          <span className="text-muted small">{filtrados.length} materiales</span>
        </div>

        {loading
          ? <div className="loading-screen"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} /> Cargando...</div>
          : (
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Unidad</th><th>Stock actual</th>
                    <th>Stock minimo</th><th>Costo unitario</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0
                    ? <tr><td colSpan={7} className="table-empty">Sin materiales registrados</td></tr>
                    : filtrados.map(m => (
                      <tr key={m.id_material}>
                        <td className="fw-bold">{m.nombre}</td>
                        <td className="text-muted">{m.unidad_medida}</td>
                        <td style={getStockStyle(m)}>
                          {Math.round(Number(m.stock_actual))}
                          {Number(m.stock_actual) < Number(m.stock_minimo) && ' (!)'}
                        </td>
                        <td className="text-muted">{Math.round(Number(m.stock_minimo))}</td>
                        <td>{moneyUnit(m.costo_unitario_actual)}</td>
                        <td>
                          <span className={`gs-badge gs-badge-${m.activo ? 'ok' : 'cancelado'}`}>
                            {m.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setModal({ type: 'reponer', material: m })}>Reponer</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setModal({ type: 'edit', material: m })}>Editar</button>
                            {m.activo
                              ? <button className="btn btn-danger btn-sm" onClick={() => { setDesactivarError(null); setADesactivar(m); }}>Quitar</button>
                              : <button className="btn btn-outline-primary btn-sm" onClick={() => reactivar(m)}>Reactivar</button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <MaterialModal material={modal.material} onClose={() => setModal(null)} onSaved={() => { setModal(null); cargar(); }} />
      )}
      {modal?.type === 'reponer' && (
        <ReponerModal material={modal.material} onClose={() => setModal(null)} onSaved={() => { setModal(null); cargar(); }} />
      )}

      {aDesactivar && (
        <ConfirmModal
          title="Desactivar material"
          message={`«${aDesactivar.nombre}» dejará de aparecer al armar recetas de productos. El historial de movimientos se conserva y podés reactivarlo cuando quieras.`}
          confirmLabel="Desactivar"
          variant="danger"
          loading={desactivando}
          error={desactivarError}
          onConfirm={confirmarDesactivar}
          onClose={() => { setADesactivar(null); setDesactivarError(null); }}
        />
      )}
    </Layout>
  );
}
