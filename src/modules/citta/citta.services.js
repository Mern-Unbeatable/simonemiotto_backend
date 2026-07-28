const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class CittaService {
  slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async create(data) {
    const province = await prisma.province.findFirst({
      where: { id: data.provinceId, isDeleted: false },
    });

    if (!province) {
      throw new AppError('Provincia not found', 404);
    }

    const name = data.name.trim();
    const slug = data.slug ? this.slugify(data.slug) : this.slugify(name);

    return prisma.city.create({
      data: {
        name,
        slug,
        provinceId: data.provinceId,
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async getAll(provinceId) {
    const where = {
      isDeleted: false,
      ...(provinceId ? { provinceId } : {}),
    };

    return prisma.city.findMany({
      where,
      include: {
        province: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: { select: { id: true, name: true, slug: true } },
          },
        },
        clinics: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id) {
    const city = await prisma.city.findFirst({
      where: { id, isDeleted: false },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: { select: { id: true, name: true, slug: true } },
          },
        },
        clinics: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!city) {
      throw new AppError('Città not found', 404);
    }

    return city;
  }

  async update(id, data) {
    await this.getById(id);

    if (data.provinceId) {
      const province = await prisma.province.findFirst({
        where: { id: data.provinceId, isDeleted: false },
      });
      if (!province) {
        throw new AppError('Provincia not found', 404);
      }
    }

    const updateData = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.slug !== undefined ? { slug: this.slugify(data.slug) } : {}),
      ...(data.provinceId !== undefined ? { provinceId: data.provinceId } : {}),
    };

    if (data.name !== undefined && data.slug === undefined) {
      updateData.slug = this.slugify(data.name);
    }

    return prisma.city.update({
      where: { id },
      data: updateData,
      include: {
        province: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: { select: { id: true, name: true, slug: true } },
          },
        },
      },
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

module.exports = CittaService;
