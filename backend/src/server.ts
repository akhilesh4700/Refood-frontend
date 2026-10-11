import { createApp } from './app';
import { env } from './config/env';
import { prisma, checkDbConnection } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 ReFood Backend Server running on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Allowed Frontend Origin: ${env.FRONTEND_ORIGIN}`);
  console.log(`====================================================`);

  // Probe database connection
  const dbHealth = await checkDbConnection();
  if (dbHealth.connected) {
    console.log('✅ PostgreSQL Database connected successfully via Prisma');
  } else {
    console.warn('⚠️  PostgreSQL Database not reachable:', dbHealth.error);
    console.warn('ℹ️  Configure DATABASE_URL in .env and run migrations to enable persistent storage');
  }
});

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('🔌 HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('📦 Database connections released.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('⚠️  Forceful shutdown initiated after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
