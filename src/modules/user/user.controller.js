const { asyncHandler } = require('../../middlewares/errorHandler');
const UserService = require('./user.service');
const {
  UserFilterDTO,
  CreateUserDTO,
  UpdateUserDTO,
  BulkActionDTO,
  UpdateUserStatusDTO,
} = require('./user.dto');
const logger = require('../../utils/logger');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = asyncHandler(async (req, res) => {
    const filterDTO = new UserFilterDTO(req.query);
    const result = await this.userService.getAllUsers(filterDTO);

    logger.audit(req.user.id, 'Users List', 'Fetched users list', {
      filters: filterDTO,
      count: result.users.length,
      ip: req.ip,
    });

    res.sendSuccess(
      result.users,
      'Users retrieved successfully',
      result.pagination,
    );
  });

  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await this.userService.getUserById(id);

    logger.audit(req.user.id, 'User Detail', `Fetched user: ${id}`, {
      targetUser: id,
      ip: req.ip,
    });

    res.sendSuccess(result, 'User details retrieved successfully');
  });

  getOrganizerProfileById = asyncHandler(async (req, res) => {
    const id = req.user.id;
    const result = await this.userService.getOrganizerProfileById(id);
    res.sendSuccess(result, 'User details retrieved successfully');
  });

  createUser = asyncHandler(async (req, res) => {
    const createUserDTO = new CreateUserDTO(req.body);
    const result = await this.userService.createUser(createUserDTO);

    logger.audit(
      req.user.id,
      'User Creation',
      `Created user: ${createUserDTO.email}`,
      {
        newUser: {
          email: createUserDTO.email,
          role: createUserDTO.role,
        },
        ip: req.ip,
      },
    );

    res.sendCreated(result, 'User created successfully');
  });

  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateUserDTO = new UpdateUserDTO(req.body);
    const result = await this.userService.updateUser(id, updateUserDTO);

    logger.audit(req.user.id, 'User Update', `Updated user: ${id}`, {
      targetUser: id,
      updates: Object.keys(updateUserDTO.getUpdateData()),
      ip: req.ip,
    });

    res.sendSuccess(result, 'User updated successfully');
  });

  updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateUserDTO = new UpdateUserStatusDTO(req.body);
    const result = await this.userService.updateUserStatus(id, updateUserDTO);

    res.sendSuccess(result, 'User updated successfully');
  });

  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.sendBadRequest('You cannot delete your own account');
    }

    await this.userService.deleteUser(id);

    logger.audit(req.user.id, 'User Deletion', `Deleted user: ${id}`, {
      targetUser: id,
      ip: req.ip,
    });

    res.sendSuccess(null, 'User deleted successfully');
  });

  getUsersByRole = asyncHandler(async (req, res) => {
    const { role } = req.params;
    const { limit } = req.query;

    const users = await this.userService.getUsersByRole(
      role,
      parseInt(limit) || 50,
    );

    res.sendSuccess(
      users,
      `${role.toLowerCase()} users retrieved successfully`,
    );
  });

  searchUsers = asyncHandler(async (req, res) => {
    const { q: searchTerm, limit } = req.query;

    if (!searchTerm) {
      return res.sendBadRequest('Search term is required');
    }

    const users = await this.userService.searchUsers(
      searchTerm,
      parseInt(limit) || 20,
    );

    res.sendSuccess(users, 'User search completed successfully');
  });

  bulkAction = asyncHandler(async (req, res) => {
    const bulkActionDTO = new BulkActionDTO(req.body);

    // Prevent self-action for destructive operations
    if (
      ['delete'].includes(bulkActionDTO.action) &&
      bulkActionDTO.userIds.includes(req.user.id)
    ) {
      return res.sendBadRequest(
        'You cannot perform this action on your own account',
      );
    }

    const result = await this.userService.bulkAction(bulkActionDTO);

    logger.audit(
      req.user.id,
      'Bulk User Action',
      `${bulkActionDTO.action} on ${bulkActionDTO.userIds.length} users`,
      {
        action: bulkActionDTO.action,
        targetUsers: bulkActionDTO.userIds,
        params: bulkActionDTO.params,
        result: result,
        ip: req.ip,
      },
    );

    res.sendSuccess(
      result,
      `Bulk ${bulkActionDTO.action} completed successfully`,
    );
  });
}

module.exports = UserController;
