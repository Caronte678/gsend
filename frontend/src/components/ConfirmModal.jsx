import { useEffect } from 'react';

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(58,46,43,0.3)', zIndex: 0 };

// Diálogo de confirmación reutilizable, con el mismo estilo que el resto de los
// modales de la app. Reemplaza a window.confirm() (que puede quedar bloqueado en
// vistas embebidas y no daba ningún feedback).
export default function ConfirmModal({
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',        // 'danger' | 'primary'
  loading = false,
  error = null,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onClose]);

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div onClick={() => !loading && onClose()} style={OVERLAY} />
      <div className="modal-dialog modal-dialog-centered" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={onClose} disabled={loading} aria-label="Cerrar" />
          </div>
          <div className="modal-body d-flex flex-column gap-3">
            {error && <div className="alert alert-danger py-2 mb-0">&#9888; {error}</div>}
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </button>
            <button type="button" className={`btn btn-${variant} btn-sm`} onClick={onConfirm} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-1" />Procesando…</>
                : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
