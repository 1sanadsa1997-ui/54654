import { PrismaClient } from '@prisma/client';

// Create Prisma client with proper configuration for Netlify Functions
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
