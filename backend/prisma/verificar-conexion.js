/**
 * GSend — Verifica que una DATABASE_URL sea válida y alcanzable.
 * No imprime la contraseña.
 *
 * Uso:
 *   1. Poner DATABASE_URL en backend/.env (que no se versiona)
 *   2. npm run verificar
 */

// Lee backend/.env, que esta en .gitignore. Asi la cadena nunca hace falta
// escribirla en la terminal ni queda en el historial de comandos.
require('dotenv').config();

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('\n❌ Falta DATABASE_URL.\n');
  console.error('  DATABASE_URL="postgresql://..." npm run verificar\n');
  process.exit(1);
}

let u;
try {
  u = new URL(url);
} catch {
  console.error('\n❌ La cadena no tiene formato de URL válido.\n');
  process.exit(1);
}

const avisos = [];
const errores = [];

if (!/^postgres(ql)?:$/.test(u.protocol)) {
  errores.push(`El protocolo es "${u.protocol}" y debería ser "postgresql:".`);
}
if (!u.username) errores.push('No trae usuario.');
if (!u.password) errores.push('No trae contraseña.');
if (!u.pathname || u.pathname === '/') errores.push('No indica el nombre de la base.');

if (u.hostname.includes('-pooler')) {
  avisos.push('Estás usando la conexión "pooled". Para GSend conviene la directa (sin -pooler): Prisma maneja su propio pool y las migraciones funcionan mejor.');
}
if (u.searchParams.get('channel_binding')) {
  avisos.push('Trae channel_binding. Si la conexion falla mas abajo, borra \'&channel_binding=require\' del final: Prisma no siempre lo soporta y no hace falta, sslmode=require ya cifra la conexion.');
}
if (!u.searchParams.get('sslmode')) {
  avisos.push('No trae ?sslmode=require. Las bases en la nube casi siempre lo necesitan.');
}

console.log('\n── Cadena de conexión ──────────────────────────────');
console.log('  servidor:  ' + u.hostname);
console.log('  base:      ' + u.pathname.slice(1));
console.log('  usuario:   ' + u.username);
console.log('  contraseña: ' + (u.password ? '(presente, no se muestra)' : '(FALTA)'));
console.log('  sslmode:   ' + (u.searchParams.get('sslmode') ?? '(no especificado)'));
console.log('  pooling:   ' + (u.hostname.includes('-pooler') ? 'SI (conviene la directa)' : 'no (correcto)'));

if (errores.length) {
  console.error('\n❌ Problemas:');
  errores.forEach((e) => console.error('   • ' + e));
  console.error('');
  process.exit(1);
}
avisos.forEach((a) => console.log('\n⚠  ' + a));

console.log('\n── Probando conexión ───────────────────────────────');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url } } });

prisma.$queryRaw`SELECT version()`
  .then((r) => {
    console.log('  ✅ Conectado.');
    console.log('  ' + String(r[0].version).split(',')[0]);
    console.log('\nLa cadena sirve. Cargala en Render como DATABASE_URL.\n');
  })
  .catch((e) => {
    console.error('  ❌ No se pudo conectar.');
    console.error('  ' + e.message.split('\n')[0]);
    console.error('');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
