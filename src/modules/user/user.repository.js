/**
 * User Management Repository
 */
const { prisma } = require('../../config/database');
const logger = require('../../utils/logger');

class UserRepository {
  async getAllUsers(filterDTO) {
    try {
      const { limit, search, role, sortBy, sortOrder, status } = filterDTO;
      const offset = filterDTO.getOffset();

      // Build where clause
      const whereClause = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        whereClause.role = role;
      }

      if (status) {
        whereClause.status = status;
      }

      // Build order clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      // Execute queries
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            avatarUrl: true,
            status: true,
            joinedAt: true,
            gender: true,
            dateOfBirth: true,
            location: true,
            headcount: true,
            companyLocation: true,
            createdAt: true,
          },
          orderBy,
          skip: offset,
          take: limit,
        }),
        prisma.user.count({
          where: whereClause,
        }),
      ]);

      return { users, total };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async createUser(userData, profileData = {}) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create base user
        const user = await tx.user.create({
          data: userData,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            address: true,
            ppsNumber: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Create role-specific profile
        if (
          userData.role === 'LANDLORD' &&
          Object.keys(profileData).length > 0
        ) {
          await tx.landlord.create({
            data: {
              userId: user.id,
              ...profileData,
            },
          });
        } else if (
          userData.role === 'TENANT' &&
          Object.keys(profileData).length > 0
        ) {
          await tx.tenant.create({
            data: {
              userId: user.id,
              ...profileData,
            },
          });
        }

        return user;
      });

      logger.info(
        `User created by admin: ${userData.email} (${userData.role})`,
      );
      return result;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          ppsNumber: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User updated by admin: ${id}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserStatus(id, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User updated by admin: ${id}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async updateOrganizeProfile(id, updateData) {
    try {
      const user = await prisma.organizerProfile.update({
        where: { userId: id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          ppsNumber: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User updated by admin: ${id}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async getOrganizeProfile(id) {
    try {
      const user = await prisma.organizerProfile.findUnique({
        where: { userId: id },
      });

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async getOrganizeProfile(id) {
    try {
      const user = await prisma.organizerProfile.findUnique({
        where: { userId: id },
      });

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      // Note: Cascade deletes will handle related records
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted by admin: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUsersByRole(role, limit = 50) {
    try {
      const users = await prisma.user.findMany({
        where: { role },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error) {
      logger.error('Error getting users by role:', error);
      throw error;
    }
  }

  async searchUsers(searchTerm, limit = 20) {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      });

      return users;
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(userIds, updateData) {
    try {
      const result = await prisma.user.updateMany({
        where: {
          id: {
            in: userIds,
          },
        },
        data: updateData,
      });

      logger.info(`Bulk updated ${result.count} users`);
      return result;
    } catch (error) {
      logger.error('Error bulk updating users:', error);
      throw error;
    }
  }

  async bulkDeleteUsers(userIds) {
    try {
      const result = await prisma.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      logger.info(`Bulk deleted ${result.count} users`);
      return result;
    } catch (error) {
      logger.error('Error bulk deleting users:', error);
      throw error;
    }
  }
}

module.exports = UserRepository;
