const AdminService = require('../services/admin.service');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

class AdminController {
  /**
   * GET /api/v1/admin/dashboard
   * Fetch system dashboard statistics
   */
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats();
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, stats, 'Admin dashboard statistics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
