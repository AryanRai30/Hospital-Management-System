const { pool } = require('../config/db.config');

class AdminModel {
  /**
   * Fetch aggregate system dashboard statistics directly from MySQL
   * @returns {Promise<{totalPatients: number, totalDoctors: number, totalAppointments: number, totalStaff: number, totalDepartments: number}>}
   */
  static async getDashboardStats() {
    const [patientsRows] = await pool.query('SELECT COUNT(*) AS totalPatients FROM patients');
    const [doctorsRows] = await pool.query('SELECT COUNT(*) AS totalDoctors FROM doctors');
    const [appointmentsRows] = await pool.query('SELECT COUNT(*) AS totalAppointments FROM appointments');
    const [staffRows] = await pool.query(
      "SELECT COUNT(*) AS totalStaff FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name != 'PATIENT'"
    );
    const [departmentsRows] = await pool.query('SELECT COUNT(*) AS totalDepartments FROM departments');

    return {
      totalPatients: Number(patientsRows[0]?.totalPatients || 0),
      totalDoctors: Number(doctorsRows[0]?.totalDoctors || 0),
      totalAppointments: Number(appointmentsRows[0]?.totalAppointments || 0),
      totalStaff: Number(staffRows[0]?.totalStaff || 0),
      totalDepartments: Number(departmentsRows[0]?.totalDepartments || 0)
    };
  }
}

module.exports = AdminModel;
