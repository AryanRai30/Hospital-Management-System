const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const corsOptions = require('./config/cors.config');
const swaggerSpec = require('./config/swagger.config');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const ApiError = require('./utils/apiError');
const { HTTP_STATUS } = require('./utils/constants');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors(corsOptions));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Uploads Folder
const uploadPath = process.env.UPLOAD_PATH || 'uploads/';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadPath)));

// Swagger API Documentation Setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1', apiRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hospital Management System API Server',
    documentation: '/api-docs',
    healthCheck: '/api/v1/health'
  });
});

// Handle 404 Routes
app.use('*', (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Cannot ${req.method} ${req.originalUrl}`));
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
