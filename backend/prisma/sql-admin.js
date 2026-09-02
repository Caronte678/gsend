/**
 * GSend — Genera el SQL para crear el usuario administrador.
 *
 * Sirve cuando no se puede correr un script contra la base (por ejemplo, si el
 * hosting no da consola, o si tu red bloquea el puerto 5432). No se conecta a
 * ninguna base: solo calcula el hash e imprime la sentencia lista para pegar
 * en el editor SQL del proveedor (Neon, Supabase, etc.).
 *
 * La contraseña nunca sale de tu computadora: lo que se imprime es el hash,
 * que es seguro de pegar y de compartir.
 *
 * Uso (PowerShell):
 *   $env:ADMIN_EMAIL="ella@ejemplo.com"
 *   $env:ADMIN_PASSWORD="una-contrasena-larga"
 *   npm run sql:admin
 */

require('dotenv').config();
const bcrypt = require('bcrypt');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('\nFaltan datos. En PowerShell:\n');
  console.error('  $env:ADMIN_EMAIL="ella@ejemplo.com"');
  console.error('  $env:ADMIN_PASSWORD="una-contrasena-larga"');
  console.error('  npm run sql:admin\n');
  process.exit(1);
}
if (!email.includes('@')) {
  console.error('\nADMIN_EMAIL no parece un email válido.\n');
  process.exit(1);
}
if (password.length < 10) {
  console.error('\nLa contraseña debe tener al menos 10 caracteres.\n');
  process.exit(1);
}

bcrypt.hash(password, 12).then(function (hash) {
  const emailSql = email.replace(/'/g, "''");
  console.log('\n== Copiá esto y pegalo en el editor SQL de Neon ==========\n');
  console.log("INSERT INTO usuarios (email, password_hash, fecha_creacion)");
  console.log("VALUES ('" + emailSql + "', '" + hash + "', NOW());");
  console.log('\n=========================================================\n');
  console.log('Usuario:    ' + email);
  console.log('Contraseña: la que escribiste (no se imprime)');
  console.log('');
  console.log('El texto de arriba contiene solo el hash, no la contraseña:');
  console.log('es seguro pegarlo. Después de ejecutarlo vas a poder iniciar');
  console.log('sesión en la app con ese email y esa contraseña.\n');
}).catch(function (e) {
  console.error('Error generando el hash:', e.message);
  process.exit(1);
});
