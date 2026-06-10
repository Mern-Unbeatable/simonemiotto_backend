/**
 * Authentication Service
 * Contains business logic for user authentication and authorization
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../../config');
const logger = require('../../utils/logger');
const { generateTokenPair, verifyRefreshToken } = require('../../utils/jwt');
const { AppError } = require('../../middlewares/errorHandler');
const AuthRepository = require('./auth.repository');
const { UserResponseDTO, AuthResponseDTO } = require('./auth.dto');
const EmailService = require('../../utils/email');

const emailService = new EmailService();

class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
  }

  sendOtpEmail = async (email, plainCode) => {
    await emailService.sendMail(
      email,
      'Verify your account',
      `Your verification code is ${plainCode}`,
      `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px; color: blue;">${plainCode}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
      `,
    );

    console.log(`OTP for ======== ${email}: ${plainCode}`);
  };

  async sendRegistrationOtp(user) {
    const plainCode = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(plainCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.authRepository.invalidateOtpTokens(
      user.id,
      'EMAIL_VERIFICATION',
    );

    await this.authRepository.createOtpToken({
      userId: user.id,
      purpose: 'EMAIL_VERIFICATION',
      codeHash,
      expiresAt,
    });

    this.sendOtpEmail(user.email, plainCode).catch((error) => {
      logger.error('Failed to send registration OTP email:', error);
    });
    return plainCode;
  }

  async register(registerDTO) {
    try {
      const userData =
        typeof registerDTO.toDatabase === 'function'
          ? registerDTO.toDatabase()
          : {
              ...registerDTO,
              email: registerDTO.email?.toLowerCase(),
              passwordHash: registerDTO.passwordHash || registerDTO.password,
            };

      const resolvedName =
        userData.name ||
        [userData.firstName, userData.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
      if (!resolvedName) {
        throw new AppError('Name is required', 400);
      }

      const existingUser = await this.authRepository.findUserByEmail(
        userData.email,
      );
      if (existingUser && existingUser.emailVerified) {
        throw new AppError('Email already registered', 409);
      }

      const hashedPassword = await bcrypt.hash(
        userData.passwordHash,
        config.security.bcryptRounds,
      );
      const preparedUserData = {
        name: resolvedName,
        email: userData.email,
        role: userData.role || 'COUPLE',
        passwordHash: hashedPassword,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
      };

      const user = existingUser
        ? await this.authRepository.updateUser(
            existingUser.id,
            preparedUserData,
          )
        : await this.authRepository.createUser(preparedUserData);

      const code = await this.sendRegistrationOtp(user);

      return {
        email: user.email,
        code,
        message:
          'Registration started. Please verify the OTP sent to your email.',
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  async verifyRegistrationOtp(verifyOtpDTO) {
    try {
      const user = await this.authRepository.findUserByEmail(
        verifyOtpDTO.email,
      );
      if (!user) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      if (user.emailVerified && user.status === 'ACTIVE') {
        throw new AppError('Email is already verified. Please login.', 400);
      }

      const otpToken = await this.authRepository.findValidOtpToken(
        user.id,
        'EMAIL_VERIFICATION',
      );
      if (!otpToken) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      const isCodeValid = await bcrypt.compare(
        verifyOtpDTO.code,
        otpToken.codeHash,
      );
      if (!isCodeValid) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      const verifiedUser = await this.authRepository.markUserEmailVerified(
        user.id,
      );
      const tokens = generateTokenPair(verifiedUser);

      await Promise.all([
        this.authRepository.markOtpTokenConsumed(otpToken.id),
        this.authRepository.createSession({
          userId: verifiedUser.id,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
        this.authRepository.updateLastLogin(verifiedUser.id),
      ]);

      logger.info(`User email verified successfully: ${verifiedUser.email}`);
      return new AuthResponseDTO(verifiedUser, tokens);
    } catch (error) {
      logger.error('Registration OTP verification failed:', error);
      throw error;
    }
  }

  async login(loginDTO) {
    try {
      const user = await this.authRepository.findUserByEmail(
        loginDTO.email,
        true,
      );
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      const isPasswordValid = await bcrypt.compare(
        loginDTO.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        logger.warn(`Failed login attempt for email: ${loginDTO.email}`);
        throw new AppError('Invalid email or password', 401);
      }

      delete user.passwordHash;

      const tokens = generateTokenPair(user);
      return { user, tokens };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  async refreshToken(refreshTokenDTO) {
    try {
      const decoded = verifyRefreshToken(refreshTokenDTO.refreshToken);

      // Ensure session is still valid (not revoked)
      const session = await this.authRepository.findSessionByRefreshToken(
        refreshTokenDTO.refreshToken,
      );
      if (!session || session.revokedAt) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      const user = await this.authRepository.findUserById(decoded.id, false);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Rotate: revoke old session, create new one
      const tokens = generateTokenPair(user);
      await Promise.all([
        this.authRepository.revokeSession(refreshTokenDTO.refreshToken),
        this.authRepository.createSession({
          userId: user.id,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ]);

      logger.debug(`Tokens refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      if (
        error.message.includes('expired') ||
        error.message.includes('invalid')
      ) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      throw error;
    }
  }

  async logout(refreshToken) {
    try {
      if (refreshToken) {
        await this.authRepository.revokeSession(refreshToken);
      }
      return true;
    } catch (error) {
      // Silently ignore if session not found
      logger.debug(
        'Logout session revoke failed (already revoked or not found)',
      );
      return true;
    }
  }

  async changePassword(userId, changePasswordDTO) {
    try {
      const user = await this.authRepository.findUserById(userId, false, true);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDTO.currentPassword,
        user.passwordHash,
      );
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      const hashedNewPassword = await bcrypt.hash(
        changePasswordDTO.newPassword,
        config.security.bcryptRounds,
      );

      await this.authRepository.updatePassword(userId, hashedNewPassword);
      logger.info(`Password changed successfully for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user;
    } catch (error) {
      logger.error('Get profile failed:', error);
      throw error;
    }
  }

  async updateProfile(userId, updateProfileDTO) {
    try {
      const updateData = {
        ...(updateProfileDTO.name !== undefined
          ? { name: updateProfileDTO.name }
          : {}),
        ...(updateProfileDTO.profileStep !== undefined
          ? { profileStep: updateProfileDTO.profileStep }
          : {}),
        ...(updateProfileDTO.isActive !== undefined
          ? { isActive: updateProfileDTO.isActive }
          : {}),
        ...(updateProfileDTO.phone !== undefined
          ? { phone: updateProfileDTO.phone }
          : {}),
      };

      if (Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400);
      }

      const user = await this.authRepository.updateUser(userId, updateData);
      logger.info(`Profile updated successfully for user: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  }

  async deleteAccount(userId) {
    try {
      await this.authRepository.deleteUser(userId);
      logger.info(`Account deleted successfully: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Account deletion failed:', error);
      throw error;
    }
  }

  async forgotPassword(forgotPasswordDTO) {
    try {
      const user = await this.authRepository.findUserByEmail(
        forgotPasswordDTO.email,
      );
      if (!user) {
        // Avoid user enumeration
        logger.debug(
          `Forgot password for non-existent email: ${forgotPasswordDTO.email}`,
        );
        return { message: 'If that email exists, a reset code has been sent.' };
      }

      const plainCode = crypto
        .randomInt(0, 1000000)
        .toString()
        .padStart(6, '0');
      const codeHash = await bcrypt.hash(plainCode, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.authRepository.createOtpToken({
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        codeHash,
        expiresAt,
      });

      this.sendOtpEmail(forgotPasswordDTO.email, plainCode).catch((error) => {
        logger.error('Failed to send password reset OTP email:', error);
      });

      // In production, send plainCode via email instead of returning it
      logger.info(`Password reset code generated for: ${user.email}`);
      return { message: 'Reset code generated', code: plainCode };
    } catch (error) {
      logger.error('Forgot password failed:', error);
      throw error;
    }
  }

  async validOtp(resetPasswordDTO) {
    try {
      const user = await this.authRepository.findUserByEmail(
        resetPasswordDTO.email,
      );
      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const otpToken = await this.authRepository.findValidOtpToken(
        user.id,
        'PASSWORD_RESET',
      );
      if (!otpToken) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const isCodeValid = await bcrypt.compare(
        resetPasswordDTO.code,
        otpToken.codeHash,
      );
      if (!isCodeValid) {
        throw new AppError('Invalid or expired reset token', 400);
      }
      return resetPasswordDTO;
    } catch (error) {
      logger.error('Reset password failed:', error);
      throw error;
    }
  }

  async resetPassword(resetPasswordDTO) {
    try {
      const user = await this.authRepository.findUserByEmail(
        resetPasswordDTO.email,
      );
      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const otpToken = await this.authRepository.findValidOtpToken(
        user.id,
        'PASSWORD_RESET',
      );
      if (!otpToken) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      console.log(
        `Comparing OTP =============: ${resetPasswordDTO.code}` +
          ` with hash: ${otpToken.codeHash}`,
      );

      const isCodeValid = await bcrypt.compare(
        resetPasswordDTO.code,
        otpToken.codeHash,
      );
      if (!isCodeValid) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const hashedPassword = await bcrypt.hash(
        resetPasswordDTO.password,
        config.security.bcryptRounds,
      );

      await Promise.all([
        this.authRepository.updatePassword(user.id, hashedPassword),
        this.authRepository.markOtpTokenConsumed(otpToken.id),
      ]);

      logger.info(`Password reset successfully for: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Reset password failed:', error);
      throw error;
    }
  }

  async resendOtp(resendOtpDTO) {
    try {
      const user = await this.authRepository.findUserByEmail(
        resendOtpDTO.email,
      );
      if (!user) {
        // Avoid user enumeration — return silently
        return { message: 'If that email exists, an OTP has been sent.' };
      }

      if (resendOtpDTO.type === 'registration') {
        if (user.emailVerified && user.status === 'ACTIVE') {
          throw new AppError('Email is already verified. Please login.', 400);
        }
        const code = await this.sendRegistrationOtp(user);
        logger.info(`Registration OTP resent to: ${user.email}`);
        return { message: 'Verification OTP resent to your email.', code };
      }

      if (resendOtpDTO.type === 'forgot-password') {
        const plainCode = crypto
          .randomInt(0, 1000000)
          .toString()
          .padStart(6, '0');
        const codeHash = await bcrypt.hash(plainCode, 10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.authRepository.invalidateOtpTokens(
          user.id,
          'PASSWORD_RESET',
        );
        await this.authRepository.createOtpToken({
          userId: user.id,
          purpose: 'PASSWORD_RESET',
          codeHash,
          expiresAt,
        });

        // await emailService.sendMail(
        //   user.email,
        //   'Your OTP Code',
        //   `Your OTP is ${plainCode}`,
        //   `
        //   <div style="font-family: Arial; padding: 20px;">
        //     <h2>Password Reset OTP</h2>
        //     <p>Your verification code is:</p>
        //     <h1 style="letter-spacing: 5px; color: blue;">${plainCode}</h1>
        //     <p>This OTP will expire in 60 minutes.</p>
        //   </div>
        //   `,
        // );

        logger.info(`Password reset OTP resent to: ${user.email}`);
        return {
          message: 'Password reset OTP resent to your email.',
          code: plainCode,
        };
      }
    } catch (error) {
      logger.error('Resend OTP failed:', error);
      throw error;
    }
  }

  async getUserStats() {
    try {
      return await this.authRepository.getUserStats();
    } catch (error) {
      logger.error('Get user stats failed:', error);
      throw error;
    }
  }

  validateUserAccess(userId, resourceOwnerId, userRole) {
    if (userRole === 'ADMIN') return true;
    if (userId === resourceOwnerId) return true;
    return false;
  }
}

module.exports = AuthService;
