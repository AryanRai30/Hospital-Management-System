const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

const extractReqInfo = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  userAgent: req.headers['user-agent']
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

class AuthController {
  /**
   * User Registration
   */
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body, extractReqInfo(req));
      return res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse(HTTP_STATUS.CREATED, result, 'User registered successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * User Login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password, extractReqInfo(req));

      // Set HTTP-only refresh token cookie
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, { user, accessToken }, 'Login successful')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access Token
   */
  static async refreshToken(req, res, next) {
    try {
      const tokenFromCookie = req.cookies && req.cookies.refreshToken;
      const tokenFromBody = req.body && req.body.refreshToken;
      const refreshTokenStr = tokenFromCookie || tokenFromBody;

      const result = await AuthService.refreshToken(refreshTokenStr, extractReqInfo(req));

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, result, 'Access token refreshed successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout User
   */
  static async logout(req, res, next) {
    try {
      const tokenFromCookie = req.cookies && req.cookies.refreshToken;
      const tokenFromBody = req.body && req.body.refreshToken;
      const refreshTokenStr = tokenFromCookie || tokenFromBody;
      const userId = req.user ? req.user.id : null;

      await AuthService.logout(refreshTokenStr, userId, extractReqInfo(req));

      // Clear cookies
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      res.clearCookie('accessToken');

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, null, 'Logged out successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated User Profile
   */
  static async getMe(req, res, next) {
    try {
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, { user: req.user }, 'Authenticated user profile retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email
   */
  static async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      const result = await AuthService.verifyEmail(token, extractReqInfo(req));

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, null, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend Verification Email
   */
  static async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendVerificationEmail(email);

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, null, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request Password Reset
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email, extractReqInfo(req));

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, null, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password with Token
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword, extractReqInfo(req));

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, null, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password (Authenticated User)
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await AuthService.changePassword(userId, currentPassword, newPassword, extractReqInfo(req));

      // Clear refresh token cookies after password change
      res.clearCookie('refreshToken', COOKIE_OPTIONS);

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, null, result.message)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
