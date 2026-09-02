import axios from 'axios';

// En desarrollo queda vacío y Vite proxea /api al backend local.
// En producción con frontend y API separados, VITE_API_URL apunta al backend
// (ej: https://gsend.onrender.com). Se define al compilar, no en tiempo de uso.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BASE}/api`,
  // El servidor gratuito se duerme tras 15 min sin visitas y tarda hasta un
  // minuto en despertar. Sin un timeout holgado, la primera visita del día
  // fallaría antes de que el servidor llegue a responder.
  timeout: 90000,
});

// ─── Aviso de conexión lenta ─────────────────────────────────────────────────
// Si una petición tarda más de lo normal, avisamos a la interfaz para que
// explique la espera en vez de dejar la pantalla congelada.
const DEMORA_MS = 3000;

let pendientes = 0;
let temporizador = null;
let lenta = false;
let desde = null;
const oyentes = new Set();

function avisar() {
  for (const fn of oyentes) fn({ lenta, desde });
}

/** Se suscribe a los cambios de estado de la conexión. Devuelve la baja. */
export function alCambiarConexion(fn) {
  oyentes.add(fn);
  fn({ lenta, desde });
  return () => oyentes.delete(fn);
}

function empieza() {
  pendientes += 1;
  if (pendientes === 1 && !temporizador) {
    temporizador = setTimeout(() => {
      lenta = true;
      desde = Date.now();
      avisar();
    }, DEMORA_MS);
  }
}

function termina() {
  pendientes = Math.max(0, pendientes - 1);
  if (pendientes === 0) {
    clearTimeout(temporizador);
    temporizador = null;
    if (lenta) {
      lenta = false;
      desde = null;
      avisar();
    }
  }
}

// ─── Interceptores ───────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  empieza();
  const token = localStorage.getItem('gsend_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => {
  termina();
  return Promise.reject(error);
});

// Si el token expira (401), limpiar sesión y redirigir al login.
// EXCEPCIÓN: el endpoint de login mismo puede devolver 401 (credenciales
// incorrectas); ahí no redirigimos, deja que Login.jsx muestre el error.
api.interceptors.response.use(
  (response) => {
    termina();
    return response;
  },
  (error) => {
    termina();
    const esLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !esLogin) {
      localStorage.removeItem('gsend_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
