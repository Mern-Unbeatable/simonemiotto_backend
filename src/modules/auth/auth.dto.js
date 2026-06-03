/**
 * Authentication Data Transfer Objects (DTOs)
 * Defines the structure of request and response data for authentication endpoints
 */

/**
 * User registration DTO
 */
class RegisterDTO {
  constructor(data) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.phone = data.phone;
    this.gender = data.gender;
    this.dateOfBirth = data.dateOfBirth;
    this.location = data.location;
    this.companyLocation = data.companyLocation;
    this.headcount = data.headcount;
  }

  toDatabase() {
    const userData = {
      email: this.email.toLowerCase(),
      passwordHash: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
    };

    if (this.phone !== undefined) userData.phone = this.phone;
    if (this.gender !== undefined) userData.gender = this.gender;
    if (this.dateOfBirth !== undefined)
      userData.dateOfBirth = this.dateOfBirth
        ? new Date(this.dateOfBirth)
        : null;
    if (this.location !== undefined) userData.location = this.location;
    if (this.headcount !== undefined) userData.headcount = this.headcount;
    if (this.companyLocation !== undefined)
      userData.companyLocation = this.companyLocation;

    return userData;
  }
}

/**
 * User login DTO
 */
class LoginDTO {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
  }
}

/**
 * User response DTO (excludes sensitive information)
 */
class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.phone = user.phone || null;
    this.avatarUrl = user.avatarUrl || null;
    this.role = user.role;
    this.status = user.status;
    this.emailVerified = user.emailVerified;
    this.gender = user.gender || null;
    this.dateOfBirth = user.dateOfBirth || null;
    this.location = user.location || null;
    this.teamClub = user.teamClub || null;
    this.headcount = user.headcount || null;
    this.companyLocation = user.companyLocation || null;
    this.joinedAt = user.joinedAt;
    this.lastLoginAt = user.lastLoginAt || null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

/**
 * Authentication response DTO
 */
class AuthResponseDTO {
  constructor(user, tokens) {
    this.user = new UserResponseDTO(user);
    this.tokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }
}

/**
 * Refresh token DTO
 */
class RefreshTokenDTO {
  constructor(data) {
    this.refreshToken = data.refreshToken;
  }
}

/**
 * Change password DTO
 */
class ChangePasswordDTO {
  constructor(data) {
    this.currentPassword = data.currentPassword;
    this.newPassword = data.newPassword;
    this.confirmPassword = data.confirmPassword;
  }
}

/**
 * Forgot password DTO
 */
class ForgotPasswordDTO {
  constructor(data) {
    this.email = data.email;
  }
}

/**
 * Reset password DTO
 */
class ResetPasswordDTO {
  constructor(data) {
    this.email = data.email;
    this.code = data.code;
    this.password = data.password;
    this.confirmPassword = data.confirmPassword;
  }
}

class VerifyOtpDTO {
  constructor(data) {
    this.email = data.email;
    this.code = data.code;
  }
}

class ResendOtpDTO {
  constructor(data) {
    this.email = data.email;
    this.type = data.type; // 'registration' | 'forgot-password'
  }
}

/**
 * Update profile DTO
 */
class UpdateProfileDTO {
  constructor(data) {
    // User Table Fields
    this.fullName = data.fullName;
    this.phone = data.phone;
    this.avatarUrl = data.avatarUrl;
    this.gender = data.gender;
    this.dateOfBirth = data.dateOfBirth;
    this.location = data.location;
    this.teamClub = data.teamClub;

    // employee Table Fields
    this.headcount = data.headcount;
    this.companyLocation = data.companyLocation;
  }

  getUpdateData() {
    const updateData = {};
    const profileData = {};
    if (this.fullName !== undefined) updateData.fullName = this.fullName;
    if (this.phone !== undefined) updateData.phone = this.phone;
    if (this.avatarUrl !== undefined) updateData.avatarUrl = this.avatarUrl;
    if (this.gender !== undefined) updateData.gender = this.gender;
    if (this.dateOfBirth !== undefined) {
      updateData.dateOfBirth = this.dateOfBirth
        ? new Date(this.dateOfBirth)
        : null;
    }
    if (this.location !== undefined) updateData.location = this.location;
    if (this.teamClub !== undefined) updateData.teamClub = this.teamClub;

    if (this.organizationName !== undefined)
      profileData.organizationName = this.organizationName;
    if (this.bio !== undefined) profileData.bio = this.bio;
    if (this.website !== undefined) profileData.website = this.website;
    if (this.headcount !== undefined) profileData.headcount = this.headcount;
    if (this.companyLocation !== undefined)
      profileData.companyLocation = this.companyLocation;

    return updateData;
  }
}

module.exports = {
  RegisterDTO,
  LoginDTO,
  UserResponseDTO,
  AuthResponseDTO,
  RefreshTokenDTO,
  ChangePasswordDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  UpdateProfileDTO,
};
