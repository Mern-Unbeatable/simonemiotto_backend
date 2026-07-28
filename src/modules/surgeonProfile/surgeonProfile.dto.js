class filterSurgeonDTO {
  constructor(query = {}) {
    this.page = parseInt(query.page) || 1;
    this.limit = parseInt(query.limit) || 10;
    this.sortBy = query.sortBy || query.sortby || 'createdAt';
    this.sortOrder = query.sortOrder || query.sortorder || 'desc';
    this.search = query.search;
    this.specialization = query.specialization;
    this.clinic = query.clinic;
    this.clinicId = query.clinicId || null;
    this.status = query.status;
    this.paymentStatus = query.paymentStatus;

    // Location hierarchy: Regione > Provincia > Città
    this.regionId = query.regionId || query.regioneId || null;
    this.provinceId = query.provinceId || query.provinciaId || null;
    this.cityId = query.cityId || query.cittaId || null;
    this.region = query.region || query.regione || null;
    this.province = query.province || query.provincia || null;
    this.city = query.city || query.citta || null;
  }

  getOffset() {
    return (this.page - 1) * this.limit;
  }
}

/**
 * Build Prisma where fragment for Regione > Provincia > Città.
 * Prefer IDs; fall back to slug/name match.
 */
function buildLocationWhere({
  regionId,
  provinceId,
  cityId,
  region,
  province,
  city,
}) {
  if (cityId) {
    return { cityId };
  }

  if (provinceId) {
    return { city: { provinceId, isDeleted: false } };
  }

  if (regionId) {
    return {
      city: {
        isDeleted: false,
        province: { regionId, isDeleted: false },
      },
    };
  }

  if (city) {
    return {
      city: {
        OR: [
          { slug: city },
          { name: { equals: city, mode: 'insensitive' } },
        ],
      },
    };
  }

  if (province) {
    return {
      city: {
        province: {
          OR: [
            { slug: province },
            { name: { equals: province, mode: 'insensitive' } },
          ],
        },
      },
    };
  }

  if (region) {
    return {
      city: {
        province: {
          region: {
            OR: [
              { slug: region },
              { name: { equals: region, mode: 'insensitive' } },
            ],
          },
        },
      },
    };
  }

  return null;
}

module.exports = {
  filterSurgeonDTO,
  buildLocationWhere,
};
