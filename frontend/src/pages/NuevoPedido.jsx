import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { money } from '../utils/labels';

// ─── Item de pedido ───────────────────────────────────────────────────────────
function ItemRow({ item, productos, onUpdate, onRemove }) {
  const producto = productos.find(p => p.id_producto === item.id_producto);
  const atributos = producto?.atributos ?? [];
  const precioBase = producto?.precio_base;

  function handleProductoChange(e) {
    const nuevoId   = parseInt(e.target.value) || '';
    const nuevoProd = productos.find(p => p.id_producto === nuevoId);
    // Autocompletar el precio con el precio base del producto elegido, salvo que
    // el usuario ya haya escrito un precio propio distinto del sugerido anterior.
    const precioActual = item.precio_venta_unitario;
    const precioEsSugerido =
      precioActual === '' ||
      (precioBase != null && Number(precioActual) === Number(precioBase));
    const nuevoPrecio =
      precioEsSugerido && nuevoProd?.precio_base != null
        ? String(nuevoProd.precio_base)
        : precioActual;
    onUpdate({ ...item, id_producto: nuevoId, valores: [], precio_venta_unitario: nuevoPrecio });
  }

  return (
    <div className="card-sm mb-3">
      <div className="row g-3 align-items-end">
        <div className="col-md-5">
          <label className="form-label">Producto *</label>
          <select className="form-select form-select-sm"
            value={item.id_producto}
            onChange={handleProductoChange}
            required>
            <option value="">— Seleccionar —</option>
            {productos.filter(p => p.activo).map(p => (
              <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Cantidad *</label>
          <input className="form-control form-control-sm" type="number" min="1" step="1"
            value={item.cantidad}
            onChange={e => onUpdate({ ...item, cantidad: parseInt(e.target.value) || 1 })}
            required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Precio unitario ($) *</label>
          <input className="form-control form-control-sm" type="number" min="0" step="0.01"
            value={item.precio_venta_unitario}
            onChange={e => onUpdate({ ...item, precio_venta_unitario: e.target.value })}
            placeholder="0.00" required />
          {precioBase != null && (
            <div className="form-text" style={{ fontSize: 10 }}>
              Sugerido: {money(precioBase)}
              {String(item.precio_venta_unitario) !== String(precioBase) && (
                <button type="button" className="btn btn-link btn-sm p-0 ms-1" style={{ fontSize: 10 }}
                  onClick={() => onUpdate({ ...item, precio_venta_unitario: String(precioBase) })}>
                  usar
                </button>
              )}
            </div>
          )}
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button type="button" className="btn btn-danger btn-sm w-100" onClick={onRemove}>✕ Quitar</button>
        </div>
      </div>

      {/* Atributos variables */}
      {atributos.length > 0 && (
        <div className="row g-2 mt-1 ps-1" style={{ borderTop: '1px solid var(--clr-border-soft)', paddingTop: 12 }}>
          {atributos.map(a => {
            const valorObj = item.valores?.find(v => v.id_atributo === a.id_atributo);
            return (
              <div key={a.id_atributo} className="col-sm-4">
                <label className="form-label">
                  {a.nombre} <span className="text-muted" style={{ fontSize: 10 }}>({a.tipo_dato})</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  type={a.tipo_dato === 'numero' ? 'number' : 'text'}
                  step={a.tipo_dato === 'numero' ? '0.01' : undefined}
                  value={valorObj?.valor ?? ''}
                  onChange={e => {
                    const nuevos = (item.valores ?? []).filter(v => v.id_atributo !== a.id_atributo);
                    if (e.target.value !== '') nuevos.push({ id_atributo: a.id_atributo, valor: e.target.value });
                    onUpdate({ ...item, valores: nuevos });
                  }}
                  placeholder={a.tipo_dato === 'numero' ? '0' : 'valor…'}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let _nextId = 1;
export default function NuevoPedido() {
  const navigate  = useNavigate();
  const [productos, setProductos] = useState([]);
  const [form, setForm]     = useState({ cliente_nombre: '', cliente_contacto: '', notas: '' });
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/productos').then(r => setProductos(r.data)).catch(() => {});
  }, []);

  function addItem() {
    setItems(prev => [...prev, { _id: _nextId++, id_producto: '', cantidad: 1, precio_venta_unitario: '', valores: [] }]);
  }

  function updateItem(idx, updated) { setItems(prev => prev.map((it, i) => i === idx ? updated : it)); }
  function removeItem(idx)          { setItems(prev => prev.filter((_, i) => i !== idx)); }

  const totalVenta = items.reduce((a, it) =>
    a + (parseFloat(it.precio_venta_unitario) || 0) * (parseInt(it.cantidad) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (items.length === 0)      { setError('Agregá al menos un producto al pedido.'); return; }
    for (const it of items) {
      if (!it.id_producto)       { setError('Seleccioná un producto en cada item.'); return; }
      if (!it.precio_venta_unitario || parseFloat(it.precio_venta_unitario) < 0)
                                 { setError('Ingresá el precio de venta en cada item.'); return; }
    }
    setLoading(true);
    try {
      const body = {
        ...form,
        items: items.map(it => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio_venta_unitario: parseFloat(it.precio_venta_unitario),
          valores: it.valores?.filter(v => v.valor !== '') ?? [],
        })),
      };
      await api.post('/pedidos', body);
      navigate('/pedidos');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al crear el pedido');
    } finally { setLoading(false); }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-header-title">+ Nuevo pedido</h1>
        <div className="page-header-actions">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/pedidos')}>← Cancelar</button>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">⚠ {error}</div>}

          {/* Datos del cliente */}
          <div className="card p-4 mb-4">
            <div className="section-title">👤 Datos del cliente</div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="ped-cliente">Nombre del cliente *</label>
                <input id="ped-cliente" className="form-control" value={form.cliente_nombre}
                  onChange={e => setForm(f => ({ ...f, cliente_nombre: e.target.value }))}
                  required placeholder="Ej: María García" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="ped-contacto">Contacto (Instagram / WhatsApp)</label>
                <input id="ped-contacto" className="form-control" value={form.cliente_contacto}
                  onChange={e => setForm(f => ({ ...f, cliente_contacto: e.target.value }))}
                  placeholder="@usuario o +54…" />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="ped-notas">Notas</label>
                <textarea id="ped-notas" className="form-control" rows={2} value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Detalles adicionales del pedido…" />
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="section-title mb-0">🛒 Productos del pedido</div>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addItem}>
                + Agregar producto
              </button>
            </div>

            {items.length === 0
              ? <div className="alert alert-info">Hacé clic en "Agregar producto" para empezar.</div>
              : (
                <>
                  {items.map((it, idx) => (
                    <ItemRow
                      key={it._id}
                      item={it}
                      productos={productos}
                      onUpdate={updated => updateItem(idx, updated)}
                      onRemove={() => removeItem(idx)}
                    />
                  ))}
                  <div className="d-flex justify-content-between align-items-center pt-3"
                    style={{ borderTop: '1px solid var(--clr-border)' }}>
                    <span className="text-muted small">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>
                      Total: {money(totalVenta)}
                    </span>
                  </div>
                </>
              )
            }
          </div>

          <div className="d-flex gap-3">
            <button type="submit" id="btn-crear-pedido" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creando pedido…</> : '✓ Crear pedido'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/pedidos')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
