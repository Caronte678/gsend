/**
 * GSend — Verifica que una cadena de conexión sea válida y alcanzable.
 * Nunca imprime la contraseña.
 *
 * Uso:
 *   1. Poné la cadena en un archivo (ver abajo cuál)
 *   2. npm run verificar
 */

// Se lee de un archivo, no de la terminal: así no queda en el historial de
// comandos ni en una captura de pantalla.
//
// Prioridad:
//   1. backend/.env.produccion  -> la base de Neon (solo para verificarla)
//   2. backend/.env             -> tu Postgres local de desarrollo
//
// Están separados a propósito: si pusieras la cadena de Neon en .env, tu app
// local pasaría a escribir sobre la base real de la clienta sin que lo notes.
const fs = require('fs');
const path = require('path');

const archivoProd = path.resolve(__dirname, '../.env.produccion');
const usandoProd = fs.existsSync(archivoProd);
require('dotenv').config(usandoProd ? { path: archivoProd } : {});

const origen = usandoProd ? 'backend/.env.produccion' : 'backend/.env';
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('\nFalta DATABASE_URL en ' + origen + '.\n');
  console.error('  Creá backend/.env.produccion con una línea:');
  console.error('  DATABASE_URL="postgresql://..."\n');
  process.exit(1);
}

let u;
try {
  u = new URL(url);
} catch {
  console.error('\nLa cadena no tiene formato de URL válido.\n');
  process.exit(1);
}

const avisos = [];
const errores = [];

if (!/^postgres(ql)?:$/.test(u.protocol)) {
  errores.push('El protocolo es "' + u.protocol + '" y debería ser "postgresql:".');
}
if (!u.username) errores.push('No trae usuario.');
if (!u.password) errores.push('No trae contraseña.');
if (!u.pathname || u.pathname === '/') errores.push('No indica el nombre de la base.');

if (u.hostname.includes('-pooler')) {
  avisos.push('Es la conexión "pooled". Para GSend conviene la directa (sin -pooler): Prisma maneja su propio pool y las migraciones necesitan conexión directa.');
}
if (u.searchParams.get('channel_binding')) {
  avisos.push('Trae channel_binding. Si la conexión falla más abajo, borrá "&channel_binding=require" del final: Prisma no siempre lo soporta y sslmode=require ya cifra la conexión.');
}
if (!u.searchParams.get('sslmode')) {
  avisos.push('No trae ?sslmode=require. Las bases en la nube casi siempre lo necesitan.');
}

console.log('\nLeyendo: ' + origen);
console.log('\n-- Cadena de conexion --------------------------------');
console.log('  servidor:   ' + u.hostname);
console.log('  base:       ' + u.pathname.slice(1));
console.log('  usuario:    ' + u.username);
console.log('  contrasena: ' + (u.password ? '(presente, no se muestra)' : '(FALTA)'));
console.log('  sslmode:    ' + (u.searchParams.get('sslmode') || '(no especificado)'));
console.log('  pooling:    ' + (u.hostname.includes('-pooler') ? 'SI (conviene la directa)' : 'no (correcto)'));

if (errores.length) {
  console.error('\nProblemas:');
  errores.forEach(function (e) { console.error('   - ' + e); });
  console.error('');
  process.exit(1);
}
avisos.forEach(function (a) { console.log('\nAviso: ' + a); });

console.log('\n-- Probando conexion ---------------------------------');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: url } } });

prisma.$queryRaw`SELECT version()`
  .then(function (r) {
    console.log('  CONECTADO');
    console.log('  ' + String(r[0].version).split(',')[0]);
    console.log('\nLa cadena sirve. Cargala en Render como DATABASE_URL.\n');
  })
  .catch(function (e) {
    var msg = String(e.message).split(String.fromCharCode(10)).filter(Boolean).slice(-1)[0];
    var inalcanzable = /Can't reach|make sure your database server is running/i.test(e.message);
    console.error('  NO SE PUDO CONECTAR');
    console.error('  ' + msg);
    if (inalcanzable) {
      console.error('');
      console.error('  El servidor no respondio en el puerto 5432. Suele ser una de dos:');
      console.error('');
      console.error('   a) Tu red bloquea el puerto 5432 (comun en redes de trabajo,');
      console.error('      universidades y algunos ISP). Comprobalo asi: si el puerto 443');
      console.error('      del mismo servidor SI abre, el problema es el bloqueo, no tu cadena.');
      console.error('      En ese caso la cadena igual sirve: quien se conecta en produccion');
      console.error('      es el servidor del hosting, no tu computadora.');
      console.error('');
      console.error('   b) La cadena apunta a un servidor equivocado. Revisa el host.');
      console.error('');
    }
    process.exit(1);
  })
  .finally(function () { prisma.$disconnect(); });
