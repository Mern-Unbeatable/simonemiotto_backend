const SettingsService = require('./settings.services');
const { asyncHandler, AppError } = require('../../middlewares/errorHandler');

class SettingsController {
  constructor() {
    this.settingsService = new SettingsService();
  }

  getSettings = asyncHandler(async (req, res) => {
    const settings = await this.settingsService.getAllSettings();
    res.sendSuccess(settings, 'Settings retrieved successfully');
  });

  updateSettings = asyncHandler(async (req, res) => {
    // Only allow admin (we can assume admin role is checked by middleware, but it's good to ensure body is correct)
    const settingsData = req.body;
    if (!settingsData || typeof settingsData !== 'object') {
      throw new AppError('Invalid settings data', 400);
    }
    const updatedSettings = await this.settingsService.updateSettings(settingsData);
    res.sendSuccess(updatedSettings, 'Settings updated successfully');
  });
}

module.exports = SettingsController;
