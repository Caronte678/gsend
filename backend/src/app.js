const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const materialesRoutes = require('./routes/materiales.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const alertasRoutes = require('./routes/alertas.routes');
const configuracionRoutes = require('./routes/configuracion.routes');

const app = express();
const enProduccion = process.env.NODE_ENV === 'production';

// Detrás de un proxy (Render, Railway, Fly) hace falta para que el rate limit
// vea la IP real del visitante y no la del balanceador.
if (enProduccion) app.set('trust proxy', 1);

// ─── CORS ────────────────────────────────────────────────────────────────────
// En producción el frontend se sirve desde este mismo servidor, así que no hace
// falta CORS. Se permite un origen extra solo si se declara explícitamente.
if (enProduccion) {
  const permitidos = (process.env.CORS_ORIGIN ?? '')
    .split(',').map((o) => o.trim()).filter(Boolean);
  if (permitidos.length) app.use(cors({ origin: permitidos }));
} else {
  app.use(cors());
}

app.use(express.json({ limit: '5mb' })); // 5mb para logos en base64

// ─── Límite de intentos de login ─────────────────────────────────────────────
// Evita que alguien pruebe contraseñas a repetición contra la cuenta admin.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Esperá 15 minutos e intentá de nuevo.' },
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/configuracion', configuracionRoutes);

// 404 en JSON para rutas /api desconocidas (antes devolvía el HTML por defecto de Express)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ─── Frontend compilado ──────────────────────────────────────────────────────
// En producción este mismo servidor entrega la SPA, así el despliegue es un solo
// servicio y el navegador nunca cruza de origen.
const distPath = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(path.join(distPath, 'index.html'))) {
  // Los assets llevan hash en el nombre: se pueden cachear de forma agresiva.
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, file) => {
      if (file.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // Cualquier otra ruta la resuelve el router de React (no cachear el HTML).
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else if (enProduccion) {
  console.warn(`[GSend] No se encontró el frontend compilado en ${distPath}.`);
  console.warn('[GSend] Ejecutá "npm run build" en frontend/ antes de iniciar en producción.');
}

// El middleware de errores va al final, después de todas las rutas
app.use(errorHandler);

module.exports = app;
