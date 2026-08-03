const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');
const healthService = require('../services/health.service');

const checkHealth = async (req, res, next) => {
  try {
    const healthData = await healthService.getSystemHealth();
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, healthData, 'Hospital Management System API is healthy')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkHealth
};
