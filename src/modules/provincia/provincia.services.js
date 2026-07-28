const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class ProvinciaService {
  slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async create(data) {
    const region = await prisma.region.findFirst({
      where: { id: data.regionId, isDeleted: false },
    });

    if (!region) {
      throw new AppError('Regione not found', 404);
    }

    const name = data.name.trim();
    const slug = data.slug ? this.slugify(data.slug) : this.slugify(name);

    return prisma.province.create({
      data: {
        name,
        slug,
        regionId: data.regionId,
      },
      include: {
        region: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async getAll(regionId, search) {
    const where = {
      isDeleted: false,
      ...(regionId ? { regionId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search.toLowerCase() } },
            ],
          }
        : {}),
    };

    return prisma.province.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        regionId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id) {
    const province = await prisma.province.findFirst({
      where: { id, isDeleted: false },
      include: {
        region: { select: { id: true, name: true, slug: true } },
        cities: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!province) {
      throw new AppError('Provincia not found', 404);
    }

    return province;
  }

  async update(id, data) {
    await this.getById(id);

    if (data.regionId) {
      const region = await prisma.region.findFirst({
        where: { id: data.regionId, isDeleted: false },
      });
      if (!region) {
        throw new AppError('Regione not found', 404);
      }
    }

    const updateData = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.slug !== undefined ? { slug: this.slugify(data.slug) } : {}),
      ...(data.regionId !== undefined ? { regionId: data.regionId } : {}),
    };

    if (data.name !== undefined && data.slug === undefined) {
      updateData.slug = this.slugify(data.name);
    }

    return prisma.province.update({
      where: { id },
      data: updateData,
      include: {
        region: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async delete(id) {
    await this.getById(id);

    await prisma.province.update({
      where: { id },
      data: { isDeleted: true },
    });

    return true;
  }
}

module.exports = ProvinciaService;
