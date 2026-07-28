const { asyncHandler } = require('../../middlewares/errorHandler');
const CittaService = require('./citta.services');

class CittaController {
  constructor() {
    this.service = new CittaService();
  }

  create = asyncHandler(async (req, res) => {
    const result = await this.service.create(req.body);
    res.sendCreated(result, 'Città created successfully');
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await this.service.getAll(req.query.provinceId, req.query.search);
    res.sendSuccess(result, 'Città retrieved successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.service.getById(req.params.id);
    res.sendSuccess(result, 'Città retrieved successfully');
  });

  update = asyncHandler(async (req, res) => {
    const result = await this.service.update(req.params.id, req.body);
    res.sendSuccess(result, 'Città updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    res.sendSuccess(null, 'Città deleted successfully');
  });
}

module.exports = CittaController;
