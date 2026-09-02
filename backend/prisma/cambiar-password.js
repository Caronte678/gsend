/**
 * GSend — Cambiar la contraseña del administrador
 *
 * Uso:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=<nueva> npm run admin:password
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('\n❌ Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD.\n');
    console.error('  ADMIN_EMAIL=admin@tupyme.com ADMIN_PASSWORD=<nueva> npm run admin:password\n');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 10) {
    console.error('\n❌ La contraseña debe tener al menos 10 caracteres.\n');
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!usuario) {
    console.error(`\n❌ No existe ningún usuario con el email "${ADMIN_EMAIL}".\n`);
    process.exit(1);
  }

  await prisma.usuario.update({
    where: { email: ADMIN_EMAIL },
    data: { password_hash: await bcrypt.hash(ADMIN_PASSWORD, 12) },
  });

  console.log(`\n✅ Contraseña actualizada para ${ADMIN_EMAIL}.\n`);
}

main()
  .catch((err) => { console.error('❌ Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
