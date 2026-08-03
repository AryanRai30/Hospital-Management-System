const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Placeholder Auth Controller
 * Business logic and user authentication will be implemented in future modules.
 */
const login = async (req, res, next) => {
  try {
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Auth login endpoint placeholder ready')
    );
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(HTTP_STATUS.CREATED, null, 'Auth registration endpoint placeholder ready')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register
};
