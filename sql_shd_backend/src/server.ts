import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { config } from './config';

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(Number(config.port), '0.0.0.0', () => {
      // const server = app.listen(Number(config.port), () => {
      console.log('🚀 Query Quest Backend Server');
      console.log(`📡 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 CORS enabled for: ${config.cors.origin}`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /health');
      console.log('  POST /api/auth/login');
      console.log('  POST /api/auth/register');
      console.log('  POST /api/auth/logout');
      console.log('  GET  /api/questions');
      console.log('  GET  /api/questions/:id');
      console.log('  POST /api/run');
      console.log('  POST /api/run/submit');
      console.log('  GET  /api/run/submissions');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('✅ HTTP server closed');

        await disconnectDatabase();
        console.log('✅ Database disconnected');

        console.log('👋 Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
