import { PrismaClient } from '@prisma/client';

// Create Prisma client with proper configuration for Netlify Functions
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

// Handle graceful shutdown
const cleanup = async () => {
  await prisma.$disconnect();
};

// Register cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

export default prisma;
