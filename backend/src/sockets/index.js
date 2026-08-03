const logger = require('../utils/logger');

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected to WebSocket: ${socket.id}`);

    // Join room setup placeholder (e.g. for emergency notifications or live status)
    socket.on('join_room', (room) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected from WebSocket: ${socket.id}`);
    });
  });
};

module.exports = setupSockets;
