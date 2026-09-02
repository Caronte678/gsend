import { useEffect, useState } from 'react';
import { alCambiarConexion } from '../services/api';

// El servidor gratuito se duerme tras 15 minutos sin visitas y tarda hasta un
// minuto en despertar. Sin este aviso la pantalla queda congelada y parece rota.
export default function ConexionBanner() {
  const [lenta, setLenta] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => alCambiarConexion(({ lenta }) => setLenta(lenta)), []);

  useEffect(() => {
    if (!lenta) { setSegundos(0); return; }
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [lenta]);

  if (!lenta) return null;

  return (
    <div className="conexion-banner" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <div className="conexion-banner-texto">
        <strong>Conectando con el servidor…</strong>
        <span>
          {segundos < 8
            ? 'Un momento.'
            : 'La primera visita del día puede tardar hasta un minuto: el servidor estaba en reposo.'}
        </span>
      </div>
      <span className="conexion-banner-reloj">{segundos}s</span>
    </div>
  );
}
