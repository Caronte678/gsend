const { PrismaClient } = require('@prisma/client');

// Instancia única de Prisma Client, reutilizada en toda la app
const prisma = new PrismaClient();

module.exports = prisma;
