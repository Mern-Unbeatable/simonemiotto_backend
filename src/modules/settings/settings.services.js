const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SettingsService {
  async getAllSettings() {
    const settings = await prisma.systemSetting.findMany();
    // Convert to a key-value object
    const result = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    return result;
  }

  async updateSettings(settingsData) {
    const promises = [];
    for (const [key, value] of Object.entries(settingsData)) {
      promises.push(
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      );
    }
    await Promise.all(promises);
    return this.getAllSettings();
  }
}

module.exports = SettingsService;
