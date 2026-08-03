const { pool, testConnection } = require('../config/db.config');

module.exports = {
  db: pool,
  testConnection
};
