const { asyncHandler } = require('../../middlewares/errorHandler');
const ClinicService = require('./clinic.services');

class ClinicController {
  constructor() {
    this.service = new ClinicService();
  }

  create = asyncHandler(async (req, res) => {
    const result = await this.service.create(req.body);
    res.sendCreated(result, 'Clinic created successfully');
  });

  getAll = asyncHandler(async (req, res) => {
    const { cityId, search } = req.query;
    const result = await this.service.getAll(cityId, search);
    res.sendSuccess(result, 'Clinic suggestions retrieved successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.service.getById(req.params.id);
    res.sendSuccess(result, 'Clinic retrieved successfully');
  });

  update = asyncHandler(async (req, res) => {
    const result = await this.service.update(req.params.id, req.body);
    res.sendSuccess(result, 'Clinic updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    res.sendSuccess(null, 'Clinic deleted successfully');
  });
}

module.exports = ClinicController;
