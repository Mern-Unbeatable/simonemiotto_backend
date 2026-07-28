const { asyncHandler } = require('../../middlewares/errorHandler');
const ProvinciaService = require('./provincia.services');

class ProvinciaController {
  constructor() {
    this.service = new ProvinciaService();
  }

  create = asyncHandler(async (req, res) => {
    const result = await this.service.create(req.body);
    res.sendCreated(result, 'Provincia created successfully');
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await this.service.getAll(req.query.regionId, req.query.search);
    res.sendSuccess(result, 'Province retrieved successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.service.getById(req.params.id);
    res.sendSuccess(result, 'Provincia retrieved successfully');
  });

  update = asyncHandler(async (req, res) => {
    const result = await this.service.update(req.params.id, req.body);
    res.sendSuccess(result, 'Provincia updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    res.sendSuccess(null, 'Provincia deleted successfully');
  });
}

module.exports = ProvinciaController;
