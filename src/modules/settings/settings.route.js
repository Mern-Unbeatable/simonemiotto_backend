const express = require('express');
const router = express.Router();
const SettingsController = require('./settings.controller');
const { authenticate, authorize } = require('../../middlewares/auth');

const controller = new SettingsController();

// GET /api/settings - Public (or auth, depending on if frontend needs it for footer)
// Since footer needs phone/email and checkout needs IBAN, making GET public is acceptable or at least accessible
router.get('/', controller.getSettings);

// PUT /api/settings - Admin only
router.put('/', authenticate, authorize(['ADMIN']), controller.updateSettings);

module.exports = router;
