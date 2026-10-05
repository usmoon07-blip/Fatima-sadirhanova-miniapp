const { PrismaClient } = require('@prisma/client');

const prisma = global.__prisma || new PrismaClient({ log: ['warn'] });
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

async function connectDatabase() {
  await prisma.$connect();
  console.log('✅ PostgreSQL (Prisma) ulandi');
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
