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
}

module.exports = EmailService;
