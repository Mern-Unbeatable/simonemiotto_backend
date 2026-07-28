const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class RegioneService {
  slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async create(data) {
    const name = data.name.trim();
    const slug = data.slug ? this.slugify(data.slug) : this.slugify(name);

    return prisma.region.create({
      data: { name, slug },
    });
  }

  async getAll(search) {
    const where = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search.toLowerCase() } },
            ],
          }
        : {}),
    };

    return prisma.region.findMany({
      where,
      include: {
        provinces: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' },
          include: {
            cities: {
              where: { isDeleted: false },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id) {
    const region = await prisma.region.findFirst({
      where: { id, isDeleted: false },
      include: {
        provinces: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' },
          include: {
            cities: {
              where: { isDeleted: false },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });

    if (!region) {
      throw new AppError('Regione not found', 404);
    }

    return region;
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

    return prisma.region.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id) {
    await this.getById(id);

    await prisma.region.update({
      where: { id },
      data: { isDeleted: true },
    });

    return true;
  }
}

module.exports = RegioneService;
