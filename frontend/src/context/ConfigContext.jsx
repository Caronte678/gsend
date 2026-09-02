import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ConfigContext = createContext(null);

const DEFAULTS = {
  nombre_pyme:  'Mi Pyme',
  logo_base64:  null,
  descripcion:  '',
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      // Usar fetch directamente (sin token) ya que es ruta pública
      const res = await fetch('/api/configuracion');
      if (res.ok) {
        const data = await res.json();
        setConfig({ ...DEFAULTS, ...data });
      }
    } catch {/**/} finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function guardar(cambios) {
    const { data } = await api.put('/configuracion', cambios);
    setConfig({ ...DEFAULTS, ...data });
    return data;
  }

  return (
    <ConfigContext.Provider value={{ config, loading, guardar, recargar: cargar }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
