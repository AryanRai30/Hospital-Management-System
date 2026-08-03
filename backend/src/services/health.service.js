const { testConnection } = require('../config/db.config');

const getSystemHealth = async () => {
  const dbConnected = await testConnection();

  return {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'CONNECTED' : 'DISCONNECTED / NOT CONFIGURED'
  };
};

module.exports = {
  getSystemHealth
};
