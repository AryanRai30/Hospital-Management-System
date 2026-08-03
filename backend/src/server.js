require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket.config');
const setupSockets = require('./sockets');
const { testConnection } = require('./config/db.config');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
setupSockets(io);

// Start Server
const startServer = async () => {
  try {
    // Attempt Database Connection Test
    await testConnection();

    server.listen(PORT, () => {
      logger.info(`==================================================`);
      logger.info(`  Hospital Management System API Server running`);
      logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  URL: http://localhost:${PORT}`);
      logger.info(`  Swagger Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`  Health Check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`==================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

startServer();
