const { asyncHandler } = require('../../middlewares/errorHandler');
const CityService = require('./city.services');

class CityController {
  constructor() {
    this.service = new CityService();
  }

  create = asyncHandler(async (req, res) => {
    const result = await this.service.create(req.body);
    res.sendCreated(result, 'City created successfully');
  });

  getAll = asyncHandler(async (req, res) => {
    const stateId = req.query.stateId;
    const result = await this.service.getAll(stateId);
    res.sendSuccess(result, 'City retrieved successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.service.getById(req.params.id);
    res.sendSuccess(result, 'City retrieved successfully');
  });

  update = asyncHandler(async (req, res) => {
    const result = await this.service.update(req.params.id, req.body);
    res.sendSuccess(result, 'City updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    res.sendSuccess(null, 'City deleted successfully');
  });
}

module.exports = CityController;
