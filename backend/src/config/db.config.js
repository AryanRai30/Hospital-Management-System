const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_management_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL Database Connected Successfully to host: ${dbConfig.host}, DB: ${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    logger.warn(`MySQL Connection Warning: ${error.message}. Ensure MySQL service is running and credentials in .env are configured.`);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
