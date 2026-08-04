const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/user.model');
const RefreshTokenModel = require('../models/refreshToken.model');
const LoginHistoryModel = require('../models/loginHistory.model');
const AuditLogModel = require('../models/auditLog.model');
const EmailService = require('./email.service');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

const MAX_FAILED_ATTEMPTS = Number(process.env.ACCOUNT_LOCK_MAX_ATTEMPTS) || 5;
const LOCKOUT_MINUTES = Number(process.env.ACCOUNT_LOCK_DURATION_MINUTES) || 30;

/**
 * Hash a plain text token using SHA-256 for secure database storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

class AuthService {
  /**
   * Register a new user account and send verification email
   */
  static async register(userData, reqInfo = {}) {
    const { roleName = 'PATIENT', firstName, lastName, email, password, phoneNumber } = userData;

    // 1. Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'An account with this email address already exists');
    }

    // 2. Validate role
    const role = await UserModel.getRoleByName(roleName);
    if (!role) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid user role specified: ${roleName}`);
    }

    // 3. Hash password (bcrypt 12 salt rounds)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Generate email verification token (24 hours expiry)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 5. Create user in database (is_email_verified = 0)
    const newUser = await UserModel.create({
      roleId: role.id,
      firstName,
      lastName,
      email,
      passwordHash,
      phoneNumber,
      emailVerificationToken: rawVerificationToken,
      emailVerificationExpires: verificationExpires
    });

    // 6. Audit Log
    await AuditLogModel.log({
      userId: newUser.id,
      action: 'USER_REGISTER',
      entityName: 'users',
      entityId: newUser.id,
      newValues: { email: newUser.email, role: role.name },
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    // 7. Send verification email immediately
    await EmailService.sendVerificationEmail(
      newUser.email,
      `${newUser.first_name} ${newUser.last_name}`,
      rawVerificationToken
    );

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role_name,
        isEmailVerified: false
      },
      message: 'Registration successful! A verification email has been sent to your inbox. Please verify your email before logging in.'
    };
  }

  /**
   * Authenticate user credentials and enforce Email Verification & Account Lockout
   */
  static async login(email, password, reqInfo = {}) {
    const user = await UserModel.findByEmail(email);

    // 1. Check user existence
    if (!user) {
      await LoginHistoryModel.record({
        email,
        status: 'FAILED',
        failureReason: 'Invalid email or user does not exist',
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent
      });
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email address or password');
    }

    // 2. Check if user account is active
    if (!user.is_active) {
      await LoginHistoryModel.record({
        userId: user.id,
        email,
        status: 'FAILED',
        failureReason: 'Account is deactivated',
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent
      });
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Your account has been deactivated. Please contact support.');
    }

    // 3. Check account lockout state
    if (user.lockout_until) {
      const lockoutTime = new Date(user.lockout_until).getTime();
      const now = Date.now();
      if (lockoutTime > now) {
        const remainingMinutes = Math.ceil((lockoutTime - now) / (60 * 1000));
        await LoginHistoryModel.record({
          userId: user.id,
          email,
          status: 'ACCOUNT_LOCKED',
          failureReason: `Account locked. ${remainingMinutes}m remaining.`,
          ipAddress: reqInfo.ip,
          userAgent: reqInfo.userAgent
        });
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Account is temporarily locked due to 5 failed login attempts. Please try again in ${remainingMinutes} minute(s).`
        );
      } else {
        // Lockout expired, reset attempts
        await UserModel.resetFailedAttempts(user.id);
      }
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await UserModel.incrementFailedAttempts(user.id);
      const updatedUser = await UserModel.findById(user.id);
      const currentAttempts = updatedUser.failed_login_attempts;

      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await UserModel.lockAccount(user.id, lockoutUntil);

        await LoginHistoryModel.record({
          userId: user.id,
          email,
          status: 'ACCOUNT_LOCKED',
          failureReason: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts`,
          ipAddress: reqInfo.ip,
          userAgent: reqInfo.userAgent
        });

        await AuditLogModel.log({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          entityName: 'users',
          entityId: user.id,
          ipAddress: reqInfo.ip,
          userAgent: reqInfo.userAgent
        });

        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Account has been locked for ${LOCKOUT_MINUTES} minutes due to ${MAX_FAILED_ATTEMPTS} failed login attempts.`
        );
      }

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - currentAttempts;
      await LoginHistoryModel.record({
        userId: user.id,
        email,
        status: 'FAILED',
        failureReason: `Invalid password. Attempts left: ${attemptsRemaining}`,
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent
      });

      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        `Invalid email address or password. ${attemptsRemaining} attempt(s) remaining before account lockout.`
      );
    }

    // 5. REQUIREMENT: PREVENT LOGIN UNTIL EMAIL IS VERIFIED
    if (!user.is_email_verified) {
      await LoginHistoryModel.record({
        userId: user.id,
        email,
        status: 'FAILED',
        failureReason: 'Email not verified',
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent
      });
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Your email address has not been verified yet. Please check your inbox for the verification link or request a new one.'
      );
    }

    // 6. Successful Login: Update last login and reset attempts
    await UserModel.updateLastLogin(user.id);

    await LoginHistoryModel.record({
      userId: user.id,
      email,
      status: 'SUCCESS',
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    await AuditLogModel.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityName: 'users',
      entityId: user.id,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    // 7. Generate JWT Tokens
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_name,
      isEmailVerified: true
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'enterprise_hospital_jwt_access_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshTokenStr = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'enterprise_hospital_jwt_refresh_secret_key_2026',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Save refresh token hash into database
    const refreshTokenHash = hashToken(refreshTokenStr);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshTokenModel.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        phoneNumber: user.phone_number,
        isEmailVerified: true
      },
      accessToken,
      refreshToken: refreshTokenStr
    };
  }

  /**
   * Refresh JWT Access Token
   */
  static async refreshToken(refreshTokenStr, reqInfo = {}) {
    if (!refreshTokenStr) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token missing');
    }

    try {
      const decoded = jwt.verify(
        refreshTokenStr,
        process.env.JWT_REFRESH_SECRET || 'enterprise_hospital_jwt_refresh_secret_key_2026'
      );

      const tokenHash = hashToken(refreshTokenStr);
      const tokenEntry = await RefreshTokenModel.findByTokenHash(tokenHash);

      if (!tokenEntry || tokenEntry.is_revoked) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is invalid or has been revoked');
      }

      if (new Date(tokenEntry.expires_at).getTime() < Date.now()) {
        await RefreshTokenModel.revokeToken(tokenHash);
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token has expired');
      }

      const user = await UserModel.findById(decoded.id);
      if (!user || !user.is_active || !user.is_email_verified) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User account associated with token is inactive or unverified.');
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role_name,
        isEmailVerified: true
      };

      const newAccessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'enterprise_hospital_jwt_access_secret_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      return {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_name,
          isEmailVerified: true
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
  }

  /**
   * Logout user and revoke refresh token
   */
  static async logout(refreshTokenStr, userId = null, reqInfo = {}) {
    if (refreshTokenStr) {
      const tokenHash = hashToken(refreshTokenStr);
      await RefreshTokenModel.revokeToken(tokenHash);
    }

    if (userId) {
      await LoginHistoryModel.recordLogout(userId);
      await AuditLogModel.log({
        userId,
        action: 'USER_LOGOUT',
        entityName: 'users',
        entityId: userId,
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Verify email address using token and send Welcome Email
   */
  static async verifyEmail(rawToken, reqInfo = {}) {
    if (!rawToken) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Verification token is required');
    }

    const user = await UserModel.findByEmailVerificationToken(rawToken);
    if (!user) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired email verification token');
    }

    if (user.is_email_verified) {
      return { message: 'Email address is already verified. You can log in.' };
    }

    if (user.email_verification_expires && new Date(user.email_verification_expires).getTime() < Date.now()) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email verification token has expired. Please request a new verification link.');
    }

    // Mark email as verified in database
    await UserModel.markEmailAsVerified(user.id);

    // Audit Log
    await AuditLogModel.log({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entityName: 'users',
      entityId: user.id,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    // Send Welcome Email after successful verification
    await EmailService.sendWelcomeEmail(user.email, `${user.first_name} ${user.last_name}`);

    return { message: 'Email address verified successfully! Welcome email sent. You can now log in.' };
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return { message: 'If an account exists with that email, a new verification link has been sent.' };
    }

    if (user.is_email_verified) {
      return { message: 'Your email address is already verified. Please proceed to log in.' };
    }

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await UserModel.setEmailVerificationToken(user.id, rawVerificationToken, verificationExpires);

    await EmailService.sendVerificationEmail(
      user.email,
      `${user.first_name} ${user.last_name}`,
      rawVerificationToken
    );

    return { message: 'A new verification email link has been sent to your email address.' };
  }

  /**
   * REQUIREMENT: Initiate Forgot Password Flow (15-Minute Expiry)
   */
  static async forgotPassword(email, reqInfo = {}) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return { message: 'If an account exists with that email address, a password reset link has been sent.' };
    }

    if (!user.is_active) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Account is inactive. Please contact support.');
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute requirement

    await UserModel.setResetPasswordToken(user.id, hashedResetToken, expiresAt);

    await AuditLogModel.log({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      entityName: 'users',
      entityId: user.id,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    await EmailService.sendPasswordResetEmail(
      user.email,
      `${user.first_name} ${user.last_name}`,
      rawResetToken
    );

    return { message: 'If an account exists with that email address, a password reset link has been sent.' };
  }

  /**
   * REQUIREMENT: Reset Password using token (single use only + notification email)
   */
  static async resetPassword(rawToken, newPassword, reqInfo = {}) {
    if (!rawToken || !newPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Reset token and new password are required');
    }

    const hashedToken = hashToken(rawToken);
    const user = await UserModel.findByResetToken(hashedToken);

    if (!user) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired password reset token');
    }

    if (user.reset_password_expires && new Date(user.reset_password_expires).getTime() < Date.now()) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Password reset token has expired (15-minute limit). Please request a new link.');
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password, clear reset token (single use), and reset lockout counters
    await UserModel.updatePassword(user.id, newPasswordHash);
    await RefreshTokenModel.revokeAllUserTokens(user.id);

    await AuditLogModel.log({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      entityName: 'users',
      entityId: user.id,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    // REQUIREMENT: Send Password Changed Confirmation Email
    await EmailService.sendPasswordChangedEmail(user.email, `${user.first_name} ${user.last_name}`);

    return { message: 'Password reset successful! A confirmation email has been sent. You can now log in with your new password.' };
  }

  /**
   * REQUIREMENT: Change Password for Authenticated User (+ notification email)
   */
  static async changePassword(userId, currentPassword, newPassword, reqInfo = {}) {
    const user = await UserModel.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User account not found');
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Incorrect current password provided');
    }

    if (currentPassword === newPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'New password cannot be identical to current password');
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await UserModel.updatePassword(userId, newPasswordHash);
    await RefreshTokenModel.revokeAllUserTokens(userId);

    await AuditLogModel.log({
      userId,
      action: 'CHANGE_PASSWORD_SUCCESS',
      entityName: 'users',
      entityId: userId,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent
    });

    // REQUIREMENT: Send Password Changed Confirmation Email
    await EmailService.sendPasswordChangedEmail(user.email, `${user.first_name} ${user.last_name}`);

    return { message: 'Password changed successfully. A confirmation email has been sent. Please log in with your new credentials.' };
  }
}

module.exports = AuthService;
