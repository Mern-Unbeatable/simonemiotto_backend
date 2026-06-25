const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class CityService {
  slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async create(data) {
    const categoryName = data.name.trim();
    const slug = data.slug
      ? this.slugify(data.slug)
      : this.slugify(categoryName);

    return prisma.city.create({
      data: {
        name: categoryName,
        slug,
      },
    });
  }

  async getAll() {
    return prisma.city.findMany({
      where: { isDeleted: false },
      include: {
        clinics: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(id) {
    const category = await prisma.city.findUnique({
      where: { id },
    });

    if (!category) {
      throw new AppError('city not found', 404);
    }

    return category;
  }

  async update(id, data) {
    await this.getById(id);

    const updateData = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.slug !== undefined ? { slug: this.slugify(data.slug) } : {}),
    };

    if (data.name !== undefined && data.slug === undefined) {
      updateData.slug = this.slugify(data.name);
    }

    return prisma.city.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id) {
    await this.getById(id);

    await prisma.city.update({
      where: { id },
      data: { isDeleted: true },
    });

    return true;
  }
}

module.exports = CityService;
