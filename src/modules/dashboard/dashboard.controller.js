const { asyncHandler } = require('../../middlewares/errorHandler');
const DashboardService = require('./dashboard.services');

class DashboardController {
  constructor() {
    this.service = new DashboardService();
  }

  getDashboardCardStats = asyncHandler(async (req, res) => {
    const result = await this.service.getDashboardCardStats();
    res.sendSuccess(result, 'Dashboard Card get successfully');
  });

  getSalesPerformance = asyncHandler(async (req, res) => {
    const { filter } = req.query;
    const result = await this.service.getSalesPerformance(filter);
    res.sendSuccess(
      result,
      'Dashboard sales performance chart get successfully',
    );
  });

  getSurgeonRegistrations = asyncHandler(async (req, res) => {
    const { filter } = req.query;
    const result = await this.service.getSurgeonRegistrations(filter);
    res.sendSuccess(
      result,
      'Dashboard surgeon registrations chart get successfully',
    );
  });

  getCombinedDashboardData = asyncHandler(async (req, res) => {
    const result = await this.service.getCombinedDashboardData();
    res.sendSuccess(result, 'Dashboard chart get successfully');
  });
}

module.exports = DashboardController;
