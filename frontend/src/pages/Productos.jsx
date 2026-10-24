import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { money, recetaLabel } from '../utils/labels';
import api from '../services/api';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };

// ─── Modal crear/editar producto ─────────────────────────────────────────────
function ProductoModal({ producto, onClose, onSaved }) {
  const editing = Boolean(producto?.id_producto);
  const [form, setForm] = useState({
    nombre:      producto?.nombre      ?? '',
    tipo:        producto?.tipo        ?? '',
    descripcion: producto?.descripcion ?? '',
    precio_base: producto?.precio_base ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function set(f, v) { setForm(x => ({ ...x, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null);

    const precio = parseFloat(form.precio_base);
    if (form.precio_base === '' || Number.isNaN(precio) || precio < 0) {
      setError('Ingresá un precio válido para el producto.');
      return;
    }

    setLoading(true);
    try {
      const body = { ...form, precio_base: precio };
      if (editing) await api.put(`/productos/${producto.id_producto}`, body);
      else await api.post('/productos', body);
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
            <h5 className="modal-title">{editing ? 'Editar producto' : 'Nuevo producto'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2">&#9888; {error}</div>}
              <div>
                <label className="form-label" htmlFor="prod-nombre">Nombre *</label>
                <input id="prod-nombre" className="form-control" value={form.nombre}
                  onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Cuadro con foto" />
              </div>
              <div className="row g-3">
                <div className="col">
                  <label className="form-label" htmlFor="prod-tipo">Tipo *</label>
                  <input id="prod-tipo" className="form-control" value={form.tipo}
                    onChange={e => set('tipo', e.target.value)} required placeholder="Ej: cuadro, libreta, sticker" />
                </div>
                <div className="col">
                  <label className="form-label" htmlFor="prod-precio">Precio ($) *</label>
                  <input id="prod-precio" className="form-control" type="number" min="0" step="0.01"
                    value={form.precio_base} onChange={e => set('precio_base', e.target.value)} required placeholder="0.00" />
                  <div className="form-text">Precio sugerido al crear pedidos. Podés ajustarlo en cada pedido.</div>
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="prod-desc">Descripcion</label>
                <textarea id="prod-desc" className="form-control" rows={3} value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)} placeholder="Descripcion opcional..." />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</> : (editing ? 'Guardar cambios' : 'Crear producto')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Modal receta ─────────────────────────────────────────────────────────────
function RecetaModal({ producto, onClose }) {
  const [receta, setReceta]         = useState(producto.receta ?? []);
  const [materiales, setMateriales] = useState([]);
  // modo 'usa':   cuánto material gasta cada unidad (2 ml de tinta por foto)
  // modo 'rinde': cuántas unidades salen de 1 material (1 hoja A4 rinde 3 fotos)
  const [form, setForm]             = useState({ id_material: '', modo: 'usa', valor: '' });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    api.get('/materiales').then(r => setMateriales(r.data)).catch(() => {});
  }, []);

  async function addReceta(e) {
    e.preventDefault(); setError(null);

    const valor = parseFloat(form.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError('Ingresá una cantidad mayor a 0.');
      return;
    }
    // La base guarda 6 decimales: 1/3 -> 0.333333
    const cantidad_por_unidad = Math.round((form.modo === 'rinde' ? 1 / valor : valor) * 1e6) / 1e6;
    if (cantidad_por_unidad <= 0) {
      setError('El rendimiento es demasiado alto.');
      return;
    }

    setLoading(true);
    try {
      const r = await api.post(`/productos/${producto.id_producto}/materiales`, {
        id_material: parseInt(form.id_material),
        cantidad_por_unidad,
      });
      setReceta(prev => {
        const idx = prev.findIndex(x => x.id_material === r.data.id_material);
        return idx >= 0 ? prev.map((x, i) => i === idx ? r.data : x) : [...prev, r.data];
      });
      setForm(f => ({ id_material: '', modo: f.modo, valor: '' }));
    } catch (err) { setError(err.response?.data?.error ?? 'Error'); }
    finally { setLoading(false); }
  }

  async function removeReceta(id_material) {
    try {
      await api.delete(`/productos/${producto.id_producto}/materiales/${id_material}`);
      setReceta(prev => prev.filter(x => x.id_material !== id_material));
    } catch (err) { setError(err.response?.data?.error ?? 'Error'); }
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div onClick={onClose} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Receta &mdash; {producto.nombre}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2 mb-3">&#9888; {error}</div>}
            <form onSubmit={addReceta} className="row g-2 align-items-end mb-2">
              <div className="col-12 col-md-4">
                <label className="form-label">Material</label>
                <select className="form-select form-select-sm" value={form.id_material}
                  onChange={e => setForm(f => ({ ...f, id_material: e.target.value }))} required>
                  <option value="">-- Seleccionar --</option>
                  {materiales.filter(m => m.activo).map(m => (
                    <option key={m.id_material} value={m.id_material}>{m.nombre} ({m.unidad_medida})</option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Cómo se mide</label>
                <select className="form-select form-select-sm" value={form.modo}
                  onChange={e => setForm(f => ({ ...f, modo: e.target.value }))}>
                  <option value="usa">Usa por unidad</option>
                  <option value="rinde">1 material rinde</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">{form.modo === 'rinde' ? 'Unidades que salen' : 'Cantidad por unidad'}</label>
                <input className="form-control form-control-sm" type="number" min="0.0001"
                  step={form.modo === 'rinde' ? '1' : 'any'}
                  placeholder={form.modo === 'rinde' ? 'Ej: 3' : 'Ej: 2'} value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required />
              </div>
              <div className="col-12 col-md-2">
                <button type="submit" className="btn btn-primary btn-sm w-100" disabled={loading}>Agregar</button>
              </div>
            </form>
            <p className="text-muted mb-4" style={{ fontSize: 11 }}>
              {form.modo === 'rinde'
                ? 'Ej: de 1 hoja A4 salen 3 fotos de 10x15 → escribí 3.'
                : 'Ej: cada foto usa 2 ml de tinta → escribí 2.'}
              {' '}Si el material ya está en la receta, se reemplaza su cantidad.
            </p>
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead><tr><th>Material</th><th>Unidad</th><th>Consumo</th><th></th></tr></thead>
                <tbody>
                  {receta.length === 0
                    ? <tr><td colSpan={4} className="table-empty">Sin materiales en la receta</td></tr>
                    : receta.map(r => (
                      <tr key={r.id_material}>
                        <td className="fw-bold">{r.material?.nombre ?? r.id_material}</td>
                        <td className="text-muted">{r.material?.unidad_medida}</td>
                        <td>{recetaLabel(r.cantidad_por_unidad, r.material?.unidad_medida)}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeReceta(r.id_material)}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Productos() {
  const [productos, setProductos]         = useState([]);
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
    try { const { data } = await api.get('/productos'); setProductos(data); }
    catch {/**/} finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function confirmarDesactivar() {
    const p = aDesactivar;
    setDesactivando(true); setDesactivarError(null);
    try {
      await api.delete(`/productos/${p.id_producto}`);
      setADesactivar(null);
      toast.ok(`«${p.nombre}» desactivado`);
      cargar();
    } catch (err) {
      setDesactivarError(err.response?.data?.error ?? 'No se pudo desactivar el producto');
    } finally { setDesactivando(false); }
  }

  async function reactivar(p) {
    try {
      await api.put(`/productos/${p.id_producto}`, { activo: true });
      toast.ok(`«${p.nombre}» reactivado`);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'No se pudo reactivar el producto');
    }
  }

  const filtrados = productos.filter(p =>
    (verInactivos || p.activo) &&
    (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
     p.tipo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-header-title">Productos</h1>
        <div className="page-header-actions">
          <button id="btn-nuevo-producto" className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'create' })}>
            + Nuevo producto
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="search-bar">
            <span className="search-bar-icon">&#128269;</span>
            <input id="search-productos" className="form-control form-control-sm"
              placeholder="Buscar producto o tipo..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="ver-inactivos-prod"
              checked={verInactivos} onChange={e => setVerInactivos(e.target.checked)} />
            <label className="form-check-label small text-muted" htmlFor="ver-inactivos-prod">Ver inactivos</label>
          </div>
          <span className="text-muted small">{filtrados.length} productos</span>
        </div>

        {loading
          ? <div className="loading-screen"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} /> Cargando...</div>
          : (
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Tipo</th><th>Precio</th>
                    <th>Materiales</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0
                    ? <tr><td colSpan={6} className="table-empty">Sin productos registrados</td></tr>
                    : filtrados.map(p => (
                      <tr key={p.id_producto}>
                        <td className="fw-bold">{p.nombre}</td>
                        <td><span className="badge bg-secondary">{p.tipo}</span></td>
                        <td>{p.precio_base != null ? money(p.precio_base) : <span className="text-muted">--</span>}</td>
                        <td className="text-muted small">{p.receta?.length ?? 0} materiales</td>
                        <td>
                          <span className={`gs-badge gs-badge-${p.activo ? 'ok' : 'cancelado'}`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary btn-sm"
                              onClick={() => setModal({ type: 'receta', producto: p })}>
                              Receta
                            </button>
                            <button className="btn btn-outline-secondary btn-sm"
                              onClick={() => setModal({ type: 'edit', producto: p })}>
                              Editar
                            </button>
                            {p.activo
                              ? (
                                <button className="btn btn-danger btn-sm" onClick={() => { setDesactivarError(null); setADesactivar(p); }}>
                                  Quitar
                                </button>
                              )
                              : (
                                <button className="btn btn-outline-primary btn-sm" onClick={() => reactivar(p)}>
                                  Reactivar
                                </button>
                              )}
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
        <ProductoModal producto={modal.producto} onClose={() => setModal(null)} onSaved={() => { setModal(null); cargar(); }} />
      )}
      {modal?.type === 'receta' && (
        <RecetaModal producto={modal.producto} onClose={() => { setModal(null); cargar(); }} />
      )}

      {aDesactivar && (
        <ConfirmModal
          title="Desactivar producto"
          message={`«${aDesactivar.nombre}» dejará de aparecer al crear pedidos nuevos. Los pedidos existentes no se modifican y podés reactivarlo cuando quieras.`}
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
