const AdminModel = require('../models/admin.model');
const logger = require('../utils/logger');

class AdminService {
  /**
   * Fetch aggregate admin dashboard statistics
   * @returns {Promise<{totalPatients: number, totalDoctors: number, totalAppointments: number, totalStaff: number, totalDepartments: number}>}
   */
  static async getDashboardStats() {
    logger.info('Fetching admin dashboard aggregate metrics');
    const stats = await AdminModel.getDashboardStats();
    return stats;
  }
}

module.exports = AdminService;
