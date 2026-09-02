import axios from 'axios';

// Cliente Axios centralizado — todas las llamadas a la API pasan por aquí
const api = axios.create({
  baseURL: '/api',
});

// Adjunta el token JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gsend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira (401), limpiar sesión y redirigir al login.
// EXCEPCIÓN: el endpoint de login mismo puede devolver 401 (credenciales incorrectas)
// en ese caso NO redirigimos — dejamos que Login.jsx muestre el error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('gsend_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
