const AuditLogModel = require('../models/auditLog.model');

/**
 * auditLogger Middleware Factory
 * Usage: router.post('/action', auditLogger('ACTION_NAME', 'entity_name'), handler)
 */
const auditLogger = (action, entityName) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;

      // Log audit event asynchronously after response is generated
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLogModel.log({
          userId: req.user ? req.user.id : null,
          action,
          entityName,
          entityId: req.params?.id || req.body?.id || null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        }).catch((err) => console.error('AuditLogger error:', err.message));
      }

      return res.send(data);
    };

    next();
  };
};

module.exports = auditLogger;
