const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const DashboardController = require('./dashboard.controller');

const router = express.Router();
const controller = new DashboardController();

router.get(
  '/card-stats',
  authenticate,
  authorize(['ADMIN']),
  controller.getDashboardCardStats,
);

router.get(
  '/sales-performance',
  authenticate,
  authorize(['ADMIN']),
  controller.getSalesPerformance,
);

router.get(
  '/surgeon-registrations',
  authenticate,
  authorize(['ADMIN']),
  controller.getSurgeonRegistrations,
);

router.get(
  '/revenue-chart',
  authenticate,
  authorize(['ADMIN']),
  controller.getCombinedDashboardData,
);

router.get(
  '/report-chart',
  authenticate,
  authorize(['ADMIN']),
  controller.getDemographicAnalytics,
);

module.exports = router;
