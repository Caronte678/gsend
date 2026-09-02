import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GSend frontend — configuración base de Vite
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redirige llamadas /api al backend en desarrollo
      '/api': 'http://localhost:4000'
    }
  }
});
