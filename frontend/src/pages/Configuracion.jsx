import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useConfig } from '../context/ConfigContext';

export default function Configuracion() {
  const { config, loading: configLoading, guardar } = useConfig();

  const [form, setForm] = useState({
    nombre_pyme:  config.nombre_pyme ?? '',
    descripcion:  config.descripcion ?? '',
    logo_base64:  config.logo_base64 ?? null,
  });
  const [preview, setPreview] = useState(config.logo_base64 ?? null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);
  const [dirty, setDirty]     = useState(false);
  const fileRef = useRef(null);

  // La configuración se carga de forma asíncrona en ConfigContext (después del
  // primer render). Sin esto, el formulario se quedaba con los valores por
  // defecto ("Mi Pyme" / vacío) aunque la pyme ya tuviera nombre y logo guardados.
  useEffect(() => {
    if (dirty) return; // no pisar cambios del usuario si la config se recarga
    setForm({
      nombre_pyme: config.nombre_pyme ?? '',
      descripcion: config.descripcion ?? '',
      logo_base64: config.logo_base64 ?? null,
    });
    setPreview(config.logo_base64 ?? null);
  }, [config, dirty]);

  function set(f, v) { setDirty(true); setForm(x => ({ ...x, [f]: v })); }

  // Cuando se selecciona un archivo de imagen → convertir a base64
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (max 2MB)
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen (JPG, PNG, SVG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2 MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result; // data:image/...;base64,...
      setPreview(base64);
      set('logo_base64', base64);
    };
    reader.readAsDataURL(file);
  }

  function quitarLogo() {
    setPreview(null);
    set('logo_base64', null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setSuccess(false); setLoading(true);
    try {
      await guardar(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al guardar');
    } finally { setLoading(false); }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-header-title">Configuracion</h1>
        <p className="text-muted small mb-0">Personaliza el nombre y logo de tu pyme</p>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 640 }}>
          {configLoading && (
            <div className="loading-screen mb-4">
              <div className="spinner-border spinner-border-sm" style={{ color: 'var(--clr-pink)' }} /> Cargando configuracion…
            </div>
          )}
          {error   && <div className="alert alert-danger mb-4">&#9888; {error}</div>}
          {success && <div className="alert alert-success mb-4">&#10003; Configuracion guardada correctamente</div>}

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">

            {/* ── Logo ── */}
            <div className="card p-4">
              <div className="section-title mb-3">Logo de la pyme</div>

              <div className="d-flex align-items-center gap-4 mb-4">
                {/* Preview del logo */}
                <div
                  style={{
                    width: 96, height: 96,
                    borderRadius: 16,
                    border: '2px dashed var(--clr-border-soft)',
                    background: 'var(--clr-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}
                >
                  {preview
                    ? <img src={preview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 32 }}>&#128247;</span>
                  }
                </div>

                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    {preview ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  {preview && (
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={quitarLogo}>
                      Quitar logo
                    </button>
                  )}
                  <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                    JPG, PNG, SVG o WebP. Max 2 MB.
                  </p>
                </div>
              </div>

              {/* Input de archivo oculto */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
            </div>

            {/* ── Nombre y descripcion ── */}
            <div className="card p-4">
              <div className="section-title mb-3">Informacion de la pyme</div>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label" htmlFor="cfg-nombre">Nombre de la pyme *</label>
                  <input
                    id="cfg-nombre"
                    className="form-control"
                    value={form.nombre_pyme}
                    onChange={e => set('nombre_pyme', e.target.value)}
                    required
                    maxLength={80}
                    placeholder="Ej: bykary.design"
                  />
                  <div className="text-muted small mt-1">
                    Aparece en la barra lateral del sistema.
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor="cfg-desc">Descripcion (opcional)</label>
                  <input
                    id="cfg-desc"
                    className="form-control"
                    value={form.descripcion}
                    onChange={e => set('descripcion', e.target.value)}
                    maxLength={120}
                    placeholder="Ej: Papeleria personalizada"
                  />
                </div>
              </div>
            </div>

            {/* ── Preview sidebar ── */}
            <div className="card p-4">
              <div className="section-title mb-3">Vista previa en sidebar</div>
              <div
                style={{
                  background: 'var(--clr-surface)',
                  border: '1px solid var(--clr-border-soft)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: preview ? 'transparent' : 'var(--clr-pink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {preview
                    ? <img src={preview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: '#fff', fontSize: 18 }}>&#10022;</span>
                  }
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--clr-text)' }}>
                    {form.nombre_pyme || 'Mi Pyme'}
                  </div>
                  {form.descripcion && (
                    <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{form.descripcion}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setForm({ nombre_pyme: config.nombre_pyme ?? '', descripcion: config.descripcion ?? '', logo_base64: config.logo_base64 ?? null });
                  setPreview(config.logo_base64 ?? null);
                  setDirty(false);
                  setError(null);
                }}
              >
                Descartar cambios
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                  : 'Guardar configuracion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
