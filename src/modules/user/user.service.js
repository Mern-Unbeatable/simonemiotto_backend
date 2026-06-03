/**
 * User Management Service
 */
const bcrypt = require('bcryptjs');
const config = require('../../config');
const logger = require('../../utils/logger');
const { AppError } = require('../../middlewares/errorHandler');
const UserRepository = require('./user.repository');
const { UserListResponseDTO, UserDetailResponseDTO } = require('./user.dto');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(filterDTO) {
    try {
      const { users, total } = await this.userRepository.getAllUsers(filterDTO);
      return {
        users: users,
        pagination: {
          currentPage: filterDTO.page,
          itemsPerPage: filterDTO.limit,
          totalItems: total,
          totalPages: Math.ceil(total / filterDTO.limit),
          hasNextPage: filterDTO.page < Math.ceil(total / filterDTO.limit),
          hasPreviousPage: filterDTO.page > 1,
        },
      };
    } catch (error) {
      logger.error('Get all users failed:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const user = await this.userRepository.getUserById(id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return new UserDetailResponseDTO(user);
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw error;
    }
  }

  async getOrganizerProfileById(id) {
    try {
      const user = await this.userRepository.getOrganizeProfile(id);

      if (!user) {
        throw new AppError('Organizer Profile not found', 404);
      }
      return user;
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw error;
    }
  }

  async createUser(createUserDTO) {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findUserByEmail(
        createUserDTO.email,
      );
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        createUserDTO.password,
        config.security.bcryptRounds,
      );

      // Prepare user data
      const userData = {
        name: createUserDTO.name,
        email: createUserDTO.email.toLowerCase(),
        password: hashedPassword,
        phone: createUserDTO.phone,
        address: createUserDTO.address,
        ppsNumber: createUserDTO.ppsNumber,
        avatar: createUserDTO.avatar,
        role: createUserDTO.role,
      };

      // Prepare profile data
      const profileData = {};

      if (createUserDTO.role === 'LANDLORD') {
        if (createUserDTO.dateOfBirth) {
          profileData.dateOfBirth = new Date(createUserDTO.dateOfBirth);
        }
        if (createUserDTO.pps) profileData.pps = createUserDTO.pps;
        if (createUserDTO.pps2) profileData.pps2 = createUserDTO.pps2;
      }

      if (createUserDTO.role === 'TENANT') {
        if (createUserDTO.moveInDate) {
          profileData.moveInDate = new Date(createUserDTO.moveInDate);
        }
        profileData.status = createUserDTO.status || 'ACTIVE';
      }

      // Create user
      const user = await this.userRepository.createUser(userData, profileData);

      // Get full user details for response
      const fullUser = await this.userRepository.getUserById(user.id);

      logger.info(`New user created by admin: ${user.email} (${user.role})`);
      return new UserDetailResponseDTO(fullUser);
    } catch (error) {
      logger.error('Create user failed:', error);
      throw error;
    }
  }

  async updateUser(id, updateUserDTO) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.getUserById(id);
      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      const updateData = updateUserDTO.getUpdateData();

      // Check if email is being updated and if it's already taken
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.userRepository.checkEmailExists(
          updateData.email,
          id,
        );
        if (emailExists) {
          throw new AppError('Email already in use', 409);
        }
        updateData.email = updateData.email.toLowerCase();
      }

      // Update user
      await this.userRepository.updateUser(id, updateData);

      // Get updated user details
      const updatedUser = await this.userRepository.getUserById(id);

      logger.info(`User updated by admin: ${id}`);
      return new UserDetailResponseDTO(updatedUser);
    } catch (error) {
      logger.error('Update user failed:', error);
      throw error;
    }
  }

  async updateUserStatus(id, updateUserDTO) {
    try {
      const existingUser = await this.userRepository.getUserById(id);
      if (!existingUser) {
        throw new AppError('User not found', 404);
      }
      const updateData = updateUserDTO.getUpdateData();
      await this.userRepository.updateUserStatus(id, updateData);
      const updatedUser = await this.userRepository.getUserById(id);
      return updatedUser;
    } catch (error) {
      logger.error('Update user failed:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      // Check if user exists
      const user = await this.userRepository.getUserById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Prevent self-deletion if needed
      // This check would need to be done in the controller with req.user.id

      await this.userRepository.deleteUser(id);

      logger.info(`User deleted by admin: ${id}`);
      return true;
    } catch (error) {
      logger.error('Delete user failed:', error);
      throw error;
    }
  }

  async getUsersByRole(role, limit = 50) {
    try {
      const users = await this.userRepository.getUsersByRole(role, limit);
      return users;
    } catch (error) {
      logger.error('Get users by role failed:', error);
      throw error;
    }
  }

  async searchUsers(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const users = await this.userRepository.searchUsers(
        searchTerm.trim(),
        limit,
      );
      return users;
    } catch (error) {
      logger.error('Search users failed:', error);
      throw error;
    }
  }

  async bulkAction(bulkActionDTO) {
    try {
      const { userIds, action, params } = bulkActionDTO;

      if (!userIds || userIds.length === 0) {
        throw new AppError('No user IDs provided', 400);
      }

      let result;

      switch (action) {
        case 'delete':
          result = await this.userRepository.bulkDeleteUsers(userIds);
          logger.info(`Bulk deleted ${result.count} users`);
          break;

        case 'changeRole':
          if (!params.role) {
            throw new AppError(
              'Role parameter is required  for changeRole action',
              400,
            );
          }
          result = await this.userRepository.bulkUpdateUsers(userIds, {
            role: params.role,
          });
          logger.info(
            `Bulk updated role for ${result.count} users to ${params.role}`,
          );
          break;

        default:
          throw new AppError(`Unsupported bulk action: ${action}`, 400);
      }

      return {
        action,
        affectedCount: result.count,
        userIds,
        params,
      };
    } catch (error) {
      logger.error('Bulk action failed:', error);
      throw error;
    }
  }


}

module.exports = UserService;
