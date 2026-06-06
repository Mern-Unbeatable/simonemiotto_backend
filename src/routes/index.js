/**
 * Main API routes index
 * Consolidates all module routes under /api/v1
 */
const express = require('express');
const router = express.Router();
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/user/user.routes');
const uploadRoutes = require('../modules/upload/upload.route');
const cityRoutes = require('../modules/city/city.route');
const clinicRoutes = require('../modules/clinic/clinic.route');
const subscriptionPlanRoutes = require('../modules/subscriptionPlan/subscriptionPlan.route');
const surgeonProfileRoutes = require('../modules/surgeonProfile/surgeonProfile.route');
const promoRoutes = require('../modules/promo/promo.route');
const applySubscriptionRoutes = require('../modules/applySubscription/applySubscription.route');
const dashboardRoutes = require('../modules/dashboard/dashboard.route');

const apiDocsHandler = require('../modules/docs/apiDocsHandler');

router.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'connected',
      api: 'running',
    },
  };

  res.sendSuccess(healthData, 'API is running healthy');
});

// API documentation endpoint
router.get('/docs', apiDocsHandler);

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/cities', cityRoutes);
router.use('/clinics', clinicRoutes);
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/surgeon-profiles', surgeonProfileRoutes);
router.use('/promo-code', promoRoutes);
router.use('/subscription', applySubscriptionRoutes);
router.use('/dashboard', dashboardRoutes);
module.exports = router;
