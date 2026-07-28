const { asyncHandler } = require('../../middlewares/errorHandler');
const RegioneService = require('./regione.services');

class RegioneController {
  constructor() {
    this.service = new RegioneService();
  }

  create = asyncHandler(async (req, res) => {
    const result = await this.service.create(req.body);
    res.sendCreated(result, 'Regione created successfully');
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await this.service.getAll(req.query.search);
    res.sendSuccess(result, 'Regioni retrieved successfully');
  });

  getDashboardTree = asyncHandler(async (req, res) => {
    const result = await this.service.getDashboardTree();
    res.sendSuccess(result, 'Location dashboard tree retrieved successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.service.getById(req.params.id);
    res.sendSuccess(result, 'Regione retrieved successfully');
  });

  update = asyncHandler(async (req, res) => {
    const result = await this.service.update(req.params.id, req.body);
    res.sendSuccess(result, 'Regione updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    res.sendSuccess(null, 'Regione deleted successfully');
  });
}

module.exports = RegioneController;
