/**
 * Prisma Client Singleton
 * 
 * Best Practice: Create a single PrismaClient instance and reuse it.
 * 
 * Why?
 * - Prisma Client manages connection pooling internally
 * - Multiple instances can exhaust database connections
 * - Single instance is more efficient
 * 
 * In development, Prisma Client handles this well, but for production
 * and best practices, we use a singleton pattern.
 * 
 * Usage:
 * import prisma from '../utils/prisma';
 * const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

// Create Prisma Client instance
const prisma = new PrismaClient({
  // Log queries in development (helps with debugging)
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
// When Node.js process exits, close Prisma connection
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
