const logger = require('../utils/logger');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  logger.warn('Nodemailer package not installed. Email links will be printed to console/logger.');
}

const getTransporter = () => {
  if (!nodemailer) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || user === 'your_hospital_email@gmail.com') {
    return null; // SMTP credentials not configured yet
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass
    }
  });
};

class EmailService {
  /**
   * Send Email Verification Link (24-Hour Expiry)
   */
  static async sendVerificationEmail(email, name, token) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${token}`;
    const from = process.env.EMAIL_FROM || 'CarePulse Hospital <no-reply@hospital.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
              🏥 CarePulse Hospital System
            </h1>
          </div>
          
          <div style="padding: 32px 24px; color: #334155;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">
              Welcome, ${name}!
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              Thank you for creating an account with the CarePulse Smart Hospital Management System.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              To ensure the security of your healthcare portal account, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              If the button above does not work, copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
            </p>
            
            <div style="margin-top: 24px; padding: 12px 16px; background-color: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                ⏰ <strong>Note:</strong> This verification link will expire in <strong>24 hours</strong>. You cannot log in until your email is verified.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">© 2026 CarePulse Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    logger.info(`[EMAIL SERVICE] Verification Link for ${email}: ${verifyUrl}`);

    const transporter = getTransporter();
    if (!transporter) {
      logger.info(`[EMAIL SERVICE] (Simulated Delivery) Verification link ready: ${verifyUrl}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Action Required: Verify Your CarePulse Account',
        html: htmlContent
      });
      logger.info(`Verification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send Welcome Email After Successful Email Verification
   */
  static async sendWelcomeEmail(email, name) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${clientUrl}/login`;
    const from = process.env.EMAIL_FROM || 'CarePulse Hospital <no-reply@hospital.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CarePulse</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <div style="background-color: #059669; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
              🎉 Email Verified Successfully!
            </h1>
          </div>
          
          <div style="padding: 32px 24px; color: #334155;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">
              Welcome aboard, ${name}!
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              Your email address has been verified successfully. Your account is now fully active and ready for use.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Log In to Portal
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">© 2026 CarePulse Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    logger.info(`[EMAIL SERVICE] Sending Welcome Email to ${email}`);

    const transporter = getTransporter();
    if (!transporter) {
      logger.info(`[EMAIL SERVICE] (Simulated Delivery) Welcome email ready for ${email}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Welcome to CarePulse Hospital Management Portal',
        html: htmlContent
      });
      return true;
    } catch (error) {
      logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send Password Reset Link (15-Minute Expiry)
   */
  static async sendPasswordResetEmail(email, name, token) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;
    const from = process.env.EMAIL_FROM || 'CarePulse Hospital <no-reply@hospital.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
              🔒 CarePulse Hospital Security
            </h1>
          </div>
          
          <div style="padding: 32px 24px; color: #334155;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">
              Password Reset Request
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              Hello ${name}, we received a request to reset the password for your CarePulse Hospital account.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" target="_blank" style="background-color: #dc2626; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              If the button above does not work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
            </p>

            <div style="margin-top: 24px; padding: 12px 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #991b1b;">
                ⚠️ <strong>Security Notice:</strong> This password reset link will expire in <strong>15 minutes</strong> and can only be used once. If you did not request this reset, please secure your account immediately.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">© 2026 CarePulse Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    logger.info(`[EMAIL SERVICE] Password Reset Link for ${email}: ${resetUrl}`);

    const transporter = getTransporter();
    if (!transporter) {
      logger.info(`[EMAIL SERVICE] (Simulated Delivery) Password reset link ready: ${resetUrl}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Reset Your CarePulse Hospital Password',
        html: htmlContent
      });
      logger.info(`Password reset email sent successfully to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
      return false;
    }
  }

  /**
   * REQUIREMENT: Send Password Changed Confirmation Email
   */
  static async sendPasswordChangedEmail(email, name) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${clientUrl}/login`;
    const from = process.env.EMAIL_FROM || 'CarePulse Hospital <no-reply@hospital.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed Confirmation</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
              🛡️ Password Changed Successfully
            </h1>
          </div>
          
          <div style="padding: 32px 24px; color: #334155;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">
              Hello ${name},
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              This email confirms that the password for your CarePulse Hospital account (<strong>${email}</strong>) has been changed successfully.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              All active sessions for your account have been invalidated for security. You can now log in with your new password.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Log In Now
              </a>
            </div>

            <div style="margin-top: 24px; padding: 12px 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #991b1b;">
                🚨 <strong>Did not change your password?</strong> If you did not make this change, please contact the hospital IT support administrator immediately to secure your account.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">© 2026 CarePulse Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    logger.info(`[EMAIL SERVICE] Sending Password Changed confirmation email to ${email}`);

    const transporter = getTransporter();
    if (!transporter) {
      logger.info(`[EMAIL SERVICE] (Simulated Delivery) Password Changed notification ready for ${email}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Security Alert: Your CarePulse Password Was Changed',
        html: htmlContent
      });
      return true;
    } catch (error) {
      logger.error(`Failed to send password changed notification email to ${email}: ${error.message}`);
      return false;
    }
  }

  /**
   * Helper to fetch active Admin emails from MySQL database
   */
  static async getAdminEmails() {
    try {
      const { pool } = require('../config/db.config');
      const [rows] = await pool.query(
        `SELECT u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ADMIN' AND u.is_active = 1`
      );
      if (rows && rows.length > 0) {
        return rows.map((r) => r.email);
      }
    } catch (err) {
      logger.warn(`Could not fetch admin emails: ${err.message}`);
    }
    return [process.env.ADMIN_EMAIL || 'admin@hospital.com'];
  }

  /**
   * Build Professional Responsive HTML Email Template for Appointments
   */
  static buildAppointmentEmailHtml(subject, title, appointment, customNote = '') {
    const hospitalName = process.env.HOSPITAL_NAME || 'CarePulse Hospital';
    const hospitalPhone = process.env.HOSPITAL_PHONE || '+1 (555) 019-9000';
    const hospitalEmail = process.env.HOSPITAL_EMAIL || 'support@hospital.com';
    const hospitalAddress = process.env.HOSPITAL_ADDRESS || '100 Health Sciences Blvd, Medical Center, Suite 400';

    const aptDate = appointment.appointment_date ? String(appointment.appointment_date).split('T')[0] : 'N/A';
    const aptTime = appointment.appointment_time || 'N/A';
    const aptMode = appointment.appointment_mode || 'OFFLINE';
    const aptType = appointment.type || 'Standard Consultation';
    const status = appointment.status || 'PENDING';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
              🏥 ${hospitalName}
            </h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Smart Healthcare & Patient Portal</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 32px 24px; color: #334155;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">
              ${title}
            </h2>
            ${customNote ? `<p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">${customNote}</p>` : ''}
            
            <!-- Appointment Card Data Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px;">
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; width: 40%;">Hospital Name:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${hospitalName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Appointment ID:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #2563eb; font-family: monospace;">${appointment.appointment_number}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Patient Name:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 500;">${appointment.patient_name || 'Patient'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Doctor Name:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 500;">${appointment.doctor_name || 'Doctor'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Department:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${appointment.department_name || 'General Medicine'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Appointment Date:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${aptDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Appointment Time:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace; font-weight: 600;">${aptTime}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Appointment Type:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${aptMode} (${aptType})</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; ${appointment.symptoms || appointment.consultation_notes ? 'border-bottom: 1px solid #e2e8f0;' : ''} font-weight: 600; color: #64748b;">Current Status:</td>
                <td style="padding: 12px 16px; ${appointment.symptoms || appointment.consultation_notes ? 'border-bottom: 1px solid #e2e8f0;' : ''} font-weight: 700; color: #059669;">${status}</td>
              </tr>
              ${appointment.symptoms ? `
              <tr>
                <td style="padding: 12px 16px; ${appointment.consultation_notes ? 'border-bottom: 1px solid #e2e8f0;' : ''} font-weight: 600; color: #64748b;">Symptoms / Reason:</td>
                <td style="padding: 12px 16px; ${appointment.consultation_notes ? 'border-bottom: 1px solid #e2e8f0;' : ''} color: #0f172a;">${appointment.symptoms || appointment.reason}</td>
              </tr>` : ''}
              ${appointment.consultation_notes ? `
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #64748b;">Consultation Notes:</td>
                <td style="padding: 12px 16px; color: #0f172a; font-style: italic;">${appointment.consultation_notes}</td>
              </tr>` : ''}
            </table>
            
            <!-- Hospital Contact Box -->
            <div style="margin-top: 24px; padding: 16px; background-color: #f1f5f9; border-left: 4px solid #0284c7; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">📍 ${hospitalName} Contact & Location</h4>
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                <strong>Phone:</strong> ${hospitalPhone} &nbsp;|&nbsp; <strong>Email:</strong> ${hospitalEmail}<br>
                <strong>Address:</strong> ${hospitalAddress}
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">© 2026 ${hospitalName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Helper to send single appointment email using SMTP or simulated delivery
   */
  static async sendAppointmentEmail(recipientEmail, subject, title, appointment, customNote = '') {
    if (!recipientEmail) return false;

    const from = process.env.EMAIL_FROM || 'CarePulse Hospital <no-reply@hospital.com>';
    const html = this.buildAppointmentEmailHtml(subject, title, appointment, customNote);

    logger.info(`[EMAIL SERVICE] Sending '${subject}' to ${recipientEmail} for Appointment ${appointment.appointment_number}`);

    const transporter = getTransporter();
    if (!transporter) {
      logger.info(`[EMAIL SERVICE] (Simulated SMTP Delivery) Email '${subject}' ready for ${recipientEmail}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        html
      });
      logger.info(`[EMAIL SERVICE SUCCESS] Email '${subject}' sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      logger.error(`[EMAIL SERVICE FAILURE] Failed sending '${subject}' to ${recipientEmail}: ${error.message}`);
      return false;
    }
  }

  /**
   * Main Appointment Event Dispatcher handling all 11 notification events
   */
  static async notifyAppointmentEvent(eventType, appointment, meta = {}) {
    if (!appointment) return;

    const patientEmail = appointment.patient_email;
    const doctorEmail = appointment.doctor_email;
    const adminEmails = await this.getAdminEmails();

    switch (eventType) {
      case 'ADMIN_CREATED':
        // 1. Admin creates appointment -> Confirmation to Patient, Assignment to Doctor
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Confirmed - ${appointment.appointment_number}`,
          'Your Appointment Has Been Booked',
          appointment,
          'An administrator has scheduled an appointment for you at CarePulse Hospital.'
        );
        await this.sendAppointmentEmail(
          doctorEmail,
          `New Appointment Assigned - ${appointment.appointment_number}`,
          'New Patient Appointment Assigned',
          appointment,
          'An administrator has assigned a new patient appointment to your schedule.'
        );
        break;

      case 'PATIENT_BOOKED':
        // 2. Patient books appointment -> Confirmation to Patient, Request to Doctor, Alert to Admin
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Booking Requested - ${appointment.appointment_number}`,
          'Appointment Booking Request Received',
          appointment,
          'Thank you for booking an appointment with CarePulse Hospital. Your request is currently pending confirmation.'
        );
        await this.sendAppointmentEmail(
          doctorEmail,
          `New Appointment Booking Request - ${appointment.appointment_number}`,
          'New Patient Booking Request',
          appointment,
          'A patient has requested an appointment with you. Please review and accept/confirm.'
        );
        for (const adminEmail of adminEmails) {
          await this.sendAppointmentEmail(
            adminEmail,
            `System Alert: New Patient Appointment Request - ${appointment.appointment_number}`,
            'New Patient Appointment Request Alert',
            appointment,
            'A new appointment request has been submitted by a patient.'
          );
        }
        break;

      case 'DOCTOR_CREATED_FOLLOWUP':
        // 3. Doctor creates Follow-up -> Follow-up email to Patient, Alert to Admin
        await this.sendAppointmentEmail(
          patientEmail,
          `Follow-up Appointment Scheduled - ${appointment.appointment_number}`,
          'Follow-up Appointment Scheduled',
          appointment,
          'Your doctor has scheduled a follow-up consultation for you.'
        );
        for (const adminEmail of adminEmails) {
          await this.sendAppointmentEmail(
            adminEmail,
            `System Alert: Follow-up Appointment Created - ${appointment.appointment_number}`,
            'Doctor Follow-up Appointment Alert',
            appointment,
            'A doctor has created a follow-up appointment.'
          );
        }
        break;

      case 'ADMIN_APPROVED':
        // 4. Admin approves appointment -> Approval emails to Patient & Doctor
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Approved - ${appointment.appointment_number}`,
          'Your Appointment Has Been Approved',
          appointment,
          'Good news! Your appointment booking has been approved and confirmed by the hospital administration.'
        );
        await this.sendAppointmentEmail(
          doctorEmail,
          `Appointment Approved - ${appointment.appointment_number}`,
          'Patient Appointment Approved',
          appointment,
          'An appointment on your schedule has been approved and confirmed by the administration.'
        );
        break;

      case 'DOCTOR_ACCEPTED':
        // 5. Doctor accepts appointment -> Confirmed email to Patient
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Confirmed by Doctor - ${appointment.appointment_number}`,
          'Your Doctor Has Confirmed Your Appointment',
          appointment,
          `Dr. ${appointment.doctor_name} has accepted and confirmed your upcoming consultation.`
        );
        break;

      case 'ADMIN_RESCHEDULED':
        // 6. Admin reschedules appointment -> Updated details to Patient & Doctor
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Rescheduled - ${appointment.appointment_number}`,
          'Your Appointment Has Been Rescheduled',
          appointment,
          'Your appointment time slot has been updated by the hospital administration. Please check the updated schedule details below.'
        );
        await this.sendAppointmentEmail(
          doctorEmail,
          `Appointment Rescheduled - ${appointment.appointment_number}`,
          'Schedule Update: Appointment Rescheduled',
          appointment,
          'An appointment on your schedule has been updated to a new date/time by administration.'
        );
        break;

      case 'DOCTOR_RESCHEDULED':
        // 7. Doctor reschedules appointment -> Updated details to Patient, Alert to Admin
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Rescheduled by Doctor - ${appointment.appointment_number}`,
          'Your Doctor Has Rescheduled Your Appointment',
          appointment,
          'Your doctor has updated the date/time of your upcoming appointment.'
        );
        for (const adminEmail of adminEmails) {
          await this.sendAppointmentEmail(
            adminEmail,
            `System Alert: Doctor Rescheduled Appointment - ${appointment.appointment_number}`,
            'Doctor Rescheduled Appointment Alert',
            appointment,
            'A doctor has updated the schedule of an appointment.'
          );
        }
        break;

      case 'PATIENT_CANCELLED':
        // 8. Patient cancels appointment -> Cancellation email to Doctor, Alert to Admin
        await this.sendAppointmentEmail(
          doctorEmail,
          `Appointment Cancelled by Patient - ${appointment.appointment_number}`,
          'Patient Cancelled Appointment',
          appointment,
          'The patient has cancelled their upcoming appointment slot.'
        );
        for (const adminEmail of adminEmails) {
          await this.sendAppointmentEmail(
            adminEmail,
            `System Alert: Patient Cancelled Appointment - ${appointment.appointment_number}`,
            'Patient Cancelled Appointment Alert',
            appointment,
            'A patient has cancelled their appointment.'
          );
        }
        break;

      case 'DOCTOR_CANCELLED':
        // 9. Doctor cancels appointment -> Cancellation email to Patient, Alert to Admin
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Cancelled by Doctor - ${appointment.appointment_number}`,
          'Notice: Your Appointment Has Been Cancelled',
          appointment,
          'We regret to inform you that your upcoming appointment has been cancelled by the doctor. Please contact us to reschedule.'
        );
        for (const adminEmail of adminEmails) {
          await this.sendAppointmentEmail(
            adminEmail,
            `System Alert: Doctor Cancelled Appointment - ${appointment.appointment_number}`,
            'Doctor Cancelled Appointment Alert',
            appointment,
            'A doctor has cancelled an appointment.'
          );
        }
        break;

      case 'ADMIN_CANCELLED':
        // 10. Admin cancels appointment -> Cancellation emails to Patient & Doctor
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Cancelled - ${appointment.appointment_number}`,
          'Notice: Appointment Cancelled',
          appointment,
          'Your appointment has been cancelled by hospital administration. Please reach out to our desk if you have any questions.'
        );
        await this.sendAppointmentEmail(
          doctorEmail,
          `Appointment Cancelled - ${appointment.appointment_number}`,
          'Schedule Update: Appointment Cancelled',
          appointment,
          'An appointment on your schedule has been cancelled by administration.'
        );
        break;

      case 'DOCTOR_COMPLETED':
        // 11. Doctor marks Completed -> Completion email to Patient
        await this.sendAppointmentEmail(
          patientEmail,
          `Appointment Completed - ${appointment.appointment_number}`,
          'Consultation Completed & Summary',
          appointment,
          'Thank you for visiting CarePulse Hospital. Your consultation has been completed by your doctor. Clinical notes are included below.'
        );
        break;

      default:
        logger.info(`[EMAIL SERVICE] Unhandled appointment event type: ${eventType}`);
        break;
    }
  }

  /**
   * Build Professional Responsive HTML Email Template for Billing & Payments
   */
  static buildBillingEmailHtml(subject, title, bill, customNote = '') {
    const hospitalName = process.env.HOSPITAL_NAME || 'CarePulse Hospital';
    const hospitalPhone = process.env.HOSPITAL_PHONE || '+1 (555) 019-9000';
    const hospitalEmail = process.env.HOSPITAL_EMAIL || 'support@hospital.com';
    const hospitalAddress = process.env.HOSPITAL_ADDRESS || '100 Health Sciences Blvd, Medical Center, Suite 400';

    const invoiceNo = bill.invoice_number || `INV-${bill.id}`;
    const billId = bill.id;
    const aptNo = bill.appointment_number || bill.appointment_id || 'N/A';
    const patientName = bill.patient_name || 'Valued Patient';
    const doctorName = bill.doctor_name || 'Attending Physician';
    const deptName = bill.department_name || 'General Outpatient';
    const consultDate = bill.appointment_date
      ? String(bill.appointment_date).split('T')[0]
      : (bill.created_at ? String(bill.created_at).split('T')[0] : 'N/A');
    const paymentMethod = bill.payment_method || 'Online Payment Gateway';
    const paymentStatus = bill.payment_status || 'UNPAID';
    const grandTotal = Number(bill.grand_total || bill.total_amount || 0).toFixed(2);
    const amountPaid = Number(bill.paid_amount || 0).toFixed(2);
    const dueBalance = Number(bill.due_amount || 0).toFixed(2);
    const txnId = bill.transaction_id || bill.razorpay_payment_id || 'N/A';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
              💳 ${hospitalName} - Billing Statement
            </h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Patient Invoice & Payment Receipt</p>
          </div>
          
          <div style="padding: 32px 24px; color: #334155;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">
              ${title}
            </h2>
            ${customNote ? `<p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">${customNote}</p>` : ''}
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px;">
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; width: 40%;">Hospital Name:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${hospitalName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Invoice Number:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #2563eb; font-family: monospace;">${invoiceNo}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Bill ID:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace;">#BILL-${billId}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Appointment ID:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace;">${aptNo}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Patient Name:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 500;">${patientName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Doctor Name:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Department:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${deptName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Consultation Date:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${consultDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Payment Method:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Payment Status:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #059669;">${paymentStatus}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Grand Total Amount:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700; font-size: 15px;">₹${grandTotal}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Amount Paid:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 700;">₹${amountPaid}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Remaining Balance:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: 700;">₹${dueBalance}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #64748b;">Transaction Reference ID:</td>
                <td style="padding: 12px 16px; color: #0f172a; font-family: monospace;">${txnId}</td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background-color: #f1f5f9; border-left: 4px solid #0284c7; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">📍 ${hospitalName} Contact & Location</h4>
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                <strong>Phone:</strong> ${hospitalPhone} &nbsp;|&nbsp; <strong>Email:</strong> ${hospitalEmail}<br>
                <strong>Address:</strong> ${hospitalAddress}
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">© 2026 ${hospitalName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Helper to send single billing email with receipt attachment
   */
  static async sendBillingEmail(recipientEmail, subject, title, bill, customNote = '', attachReceipt = true) {
    if (!recipientEmail) return false;

    const from = process.env.EMAIL_FROM || 'CarePulse Hospital <no-reply@hospital.com>';
    const html = this.buildBillingEmailHtml(subject, title, bill, customNote);

    logger.info(`[EMAIL SERVICE] Sending Billing Email '${subject}' to ${recipientEmail}`);

    const transporter = getTransporter();
    const mailOptions = {
      from,
      to: recipientEmail,
      subject,
      html
    };

    if (attachReceipt && bill) {
      mailOptions.attachments = [
        {
          filename: `Receipt-${bill.invoice_number || 'INV'}.html`,
          content: html,
          contentType: 'text/html'
        }
      ];
    }

    if (!transporter) {
      logger.info(`[EMAIL SERVICE] (Simulated SMTP Delivery) Billing Email '${subject}' ready for ${recipientEmail}`);
      return true;
    }

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`[EMAIL SERVICE SUCCESS] Billing Email '${subject}' sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      logger.error(`[EMAIL SERVICE FAILURE] Failed sending Billing Email '${subject}' to ${recipientEmail}: ${error.message}`);
      return false;
    }
  }

  /**
   * Billing Event Dispatcher handling all billing notification events
   */
  static async notifyBillingEvent(eventType, bill, meta = {}) {
    if (!bill) return;

    const patientEmail = bill.patient_email;
    const doctorEmail = bill.doctor_email;

    switch (eventType) {
      case 'BILL_GENERATED':
        // 1. When bill is generated -> Email Patient
        await this.sendBillingEmail(
          patientEmail,
          `New Billing Invoice Issued - ${bill.invoice_number}`,
          'Hospital Bill Generated',
          bill,
          'A new billing statement has been generated for your medical services. Please review invoice details below.'
        );
        break;

      case 'PAYMENT_SUCCESS':
        // 2. When payment is successful -> Email Patient & Doctor
        await this.sendBillingEmail(
          patientEmail,
          `Payment Receipt & Confirmation - ${bill.invoice_number}`,
          'Payment Received Successfully',
          bill,
          'Thank you! Your payment for the invoice has been processed successfully.'
        );
        await this.sendBillingEmail(
          doctorEmail,
          `Payment Notification - ${bill.invoice_number}`,
          'Patient Payment Received',
          bill,
          'A patient associated with your consultation has completed payment for their invoice.'
        );
        break;

      case 'PARTIAL_PAYMENT_RECEIVED':
        // 3. When partial payment is received -> Email Patient
        await this.sendBillingEmail(
          patientEmail,
          `Partial Payment Receipt - ${bill.invoice_number}`,
          'Partial Payment Received',
          bill,
          `A partial payment of ₹${meta.installmentAmount || bill.paid_amount} has been received for your hospital bill. Remaining due balance: ₹${bill.due_amount}.`
        );
        break;

      case 'PAYMENT_FAILED':
        // 4. When payment fails -> Email Patient
        await this.sendBillingEmail(
          patientEmail,
          `Payment Failed Notice - ${bill.invoice_number}`,
          'Payment Processing Failed',
          bill,
          'We were unable to process your online payment. Please check your payment method or try again.'
        );
        break;

      case 'PAYMENT_REFUNDED':
        // 5. When payment is refunded -> Email Patient & Doctor
        await this.sendBillingEmail(
          patientEmail,
          `Refund Processed Notice - ${bill.invoice_number}`,
          'Payment Refund Issued',
          bill,
          'A refund has been processed for your hospital billing payment.'
        );
        await this.sendBillingEmail(
          doctorEmail,
          `Billing Refund Alert - ${bill.invoice_number}`,
          'Payment Refund Alert',
          bill,
          'A billing payment associated with your consultation has been refunded.'
        );
        break;

      case 'INVOICE_GENERATED':
        // 6. When invoice is generated / sent -> Email Patient
        await this.sendBillingEmail(
          patientEmail,
          `Official Medical Invoice - ${bill.invoice_number}`,
          'Medical Service Invoice',
          bill,
          'Please find your official medical bill invoice summary below.'
        );
        break;

      case 'OFFLINE_PAYMENT_RECORDED':
        // 7. When Admin records an offline payment -> Email Patient
        await this.sendBillingEmail(
          patientEmail,
          `Offline Payment Receipt - ${bill.invoice_number}`,
          'Offline Payment Recorded',
          bill,
          'An offline payment (Cash / Card / Counter) has been recorded against your hospital bill by hospital administration.'
        );
        break;

      default:
        logger.info(`[EMAIL SERVICE] Unhandled billing event type: ${eventType}`);
        break;
    }
  }
}

module.exports = EmailService;
