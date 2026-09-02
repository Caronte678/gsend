/**
 * GSend — Seed del usuario administrador
 *
 * La contraseña NO se escribe en este archivo: se toma de variables de entorno,
 * para que nunca quede en el repositorio.
 *
 * Uso local (con backend/.env):
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
 *
 * Uso en producción (consola del hosting):
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
 *   ...y después borrá esas variables del panel.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function abortar(mensaje) {
  console.error(`\n❌ ${mensaje}\n`);
  console.error('Ejemplo:');
  console.error('  ADMIN_EMAIL=admin@tupyme.com ADMIN_PASSWORD=<contraseña> npm run seed\n');
  process.exit(1);
}

async function main() {
  if (!ADMIN_EMAIL) abortar('Falta ADMIN_EMAIL.');
  if (!ADMIN_PASSWORD) abortar('Falta ADMIN_PASSWORD.');
  if (ADMIN_PASSWORD.length < 10) {
    abortar('ADMIN_PASSWORD debe tener al menos 10 caracteres.');
  }

  const existente = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existente) {
    console.log(`\n⚠  Ya existe un usuario con el email "${ADMIN_EMAIL}".`);
    console.log('   Para cambiarle la contraseña usá:  npm run admin:password\n');
    return;
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const usuario = await prisma.usuario.create({
    data: { email: ADMIN_EMAIL, password_hash },
  });

  console.log('\n✅ Usuario administrador creado:');
  console.log(`   Email: ${usuario.email}`);
  console.log('   Contraseña: la que pasaste en ADMIN_PASSWORD (no se guarda en texto plano)\n');
}

main()
  .catch((err) => {
    console.error('❌ Error durante el seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
