require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;
// Los hostings enrutan el tráfico desde afuera del contenedor: escuchar solo en
// localhost haría que el servicio parezca caído.
const HOST = process.env.HOST || '0.0.0.0';

// Fallar temprano si falta configuración crítica, en vez de arrancar y romper
// recién cuando alguien intenta iniciar sesión.
const requeridas = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = requeridas.filter((v) => !process.env[v]);
if (faltantes.length) {
  console.error(`[GSend] Faltan variables de entorno: ${faltantes.join(', ')}`);
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('[GSend] JWT_SECRET es demasiado corto para producción (mínimo 32 caracteres).');
  console.error('[GSend] Generá uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  process.exit(1);
}

const server = app.listen(PORT, HOST, () => {
  const modo = process.env.NODE_ENV === 'production' ? 'producción' : 'desarrollo';
  console.log(`GSend backend escuchando en ${HOST}:${PORT} (${modo})`);
});

// Cierre ordenado: los hostings mandan SIGTERM al redesplegar.
for (const señal of ['SIGTERM', 'SIGINT']) {
  process.on(señal, () => {
    console.log(`\n[GSend] ${señal} recibido, cerrando...`);
    server.close(() => process.exit(0));
  });
}
