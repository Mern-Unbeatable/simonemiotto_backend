/**
 * Authentication Controller
 * Handles HTTP requests and responses for authentication endpoints
 */
const { asyncHandler } = require('../../middlewares/errorHandler');
const AuthService = require('./auth.service');
const {
  LoginDTO,
  RefreshTokenDTO,
  ChangePasswordDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  filterUserDTO,
} = require('./auth.dto');
const logger = require('../../utils/logger');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @method POST /api/v1/auth/register
   * Register a new user account
   * @example POST /api/v1/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const result = await this.authService.register(req.body);

    res.sendCreated(
      result,
      'Registration started. Please verify OTP sent to your email',
    );
  });

  verifyRegistrationOtp = asyncHandler(async (req, res) => {
    const verifyOtpDTO = new VerifyOtpDTO(req.body);
    const result = await this.authService.verifyRegistrationOtp(verifyOtpDTO);

    res.sendSuccess(result, 'Email verified successfully');
  });

  /**
   * @method POST /api/v1/auth/login
   * Authenticate user credentials
   * @example POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const loginDTO = new LoginDTO(req.body);
    const result = await this.authService.login(loginDTO);
    res.sendSuccess(result, 'Login successful');
  });

  /**
   * @method POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   * @example POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    const refreshTokenDTO = new RefreshTokenDTO(req.body);
    const result = await this.authService.refreshToken(refreshTokenDTO);

    res.sendSuccess(result, 'Token refreshed successfully');
  });

  /**
   * @method POST /api/v1/auth/logout
   * Logout user (client-side token removal)
   * @example POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await this.authService.logout(refreshToken);

    logger.audit(req.user?.id, 'User Logout', `User: ${req.user?.email}`, {
      ip: req.ip,
    });

    res.sendSuccess(null, 'Logged out successfully');
  });

  /**
   * @method POST /api/v1/auth/change-password
   * Change user password (requires authentication)
   * @example POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const changePasswordDTO = new ChangePasswordDTO(req.body);
    await this.authService.changePassword(req.user.id, changePasswordDTO);

    logger.audit(req.user.id, 'Password Change', `User: ${req.user.email}`, {
      ip: req.ip,
    });

    res.sendSuccess(null, 'Password changed successfully');
  });

  /**
   * @method GET /api/v1/auth/profile
   * Get current user profile information
   * @example GET /api/v1/auth/profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const result = await this.authService.getProfile(req.user.id);

    res.sendSuccess(result, 'Profile retrieved successfully');
  });

  /**
   * @method PUT /api/v1/auth/profile
   * Update user profile information
   * @example PUT /api/v1/auth/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const file = req.file;
    if (file) {
      req.body.avatarUrl = `/uploads/${file.filename}`;
    }

    const result = await this.authService.updateProfile(req.user.id, req.body);

    logger.audit(req.user.id, 'Profile Update', `User: ${req.user.email}`, {
      updates: Object.keys(req.body || {}),
      ip: req.ip,
    });

    res.sendSuccess(result, 'Profile updated successfully');
  });

  /**
   * @method DELETE /api/v1/auth/account
   * Delete user account (requires authentication)
   * @example DELETE /api/v1/auth/account
   */
  deleteAccount = asyncHandler(async (req, res) => {
    await this.authService.deleteAccount(req.user.id);

    logger.audit(req.user.id, 'Account Deletion', `User: ${req.user.email}`, {
      ip: req.ip,
    });

    res.sendSuccess(null, 'Account deleted successfully');
  });

  /**
   * @method GET /api/v1/auth/me
   * Get current authenticated user info (lightweight endpoint)
   * @example GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    res.sendSuccess(user, 'Current user retrieved successfully');
  });

  /**
   * @method POST /api/v1/auth/forgot-password
   * Request a password reset code
   * @example POST /api/v1/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const forgotPasswordDTO = new ForgotPasswordDTO(req.body);
    const result = await this.authService.forgotPassword(forgotPasswordDTO);

    res.sendSuccess(result, 'If the email exists, a reset code has been sent');
  });

  /**
   * @method POST /api/v1/auth/reset-password
   * Reset password using a verification code
   * @example POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const resetPasswordDTO = new ResetPasswordDTO(req.body);
    await this.authService.resetPassword(resetPasswordDTO);

    res.sendSuccess(null, 'Password reset successfully');
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const verifyOtpDTO = new VerifyOtpDTO(req.body);
    const result = await this.authService.validOtp(verifyOtpDTO);
    res.sendSuccess(result, 'Otp verify successfully');
  });

  resendOtp = asyncHandler(async (req, res) => {
    const resendOtpDTO = new ResendOtpDTO(req.body);
    const result = await this.authService.resendOtp(resendOtpDTO);
    res.sendSuccess(result, 'OTP resent successfully');
  });

  /**
   * @method GET /api/v1/auth/stats
   * Get user statistics (admin only)
   * @example GET /api/v1/auth/stats
   */
  getUserStats = asyncHandler(async (req, res) => {
    const stats = await this.authService.getUserStats();

    res.sendSuccess(stats, 'User statistics retrieved successfully');
  });

  getAllUsers = asyncHandler(async (req, res) => {
    const filterDTO = new filterUserDTO(req.query);
    const result = await this.authService.getAllUsers(filterDTO);
    res.sendSuccess(
      result.data,
      'Users retrieved successfully',
      result.pagination,
    );
  });
}

module.exports = AuthController;
