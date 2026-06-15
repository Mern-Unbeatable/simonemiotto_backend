const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const bcrypt = require('bcryptjs');
const { generateTokenPair } = require('../../utils/jwt');
const emailEmitter = require('../../utils/eventEmitter');

class surgeonProfileService {
  createSlug(value) {
    const baseSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const shortId = Math.floor(10000 + Math.random() * 90000);
    return `${baseSlug}-${shortId}`;
  }
  async createSurgeonProfile(imageUrls, data) {
    const {
      name,
      email,
      password,
      phone,
      cityId,
      clinicId,
      specialization,
      experience,
      experienceYears,
      language,
      patientApproach,
      bio,
      address,
      availability,
      boardRegistrationNumber,
      governmentIDFrontUrl,
      governmentIDBackUrl,
      certificateUrls,
      avatarUrl,
      education,
      areasExpertise,
      certifications,
      procedures,
    } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const [city, clinic] = await Promise.all([
      prisma.city.findUnique({ where: { id: cityId } }),
      prisma.clinic.findUnique({ where: { id: clinicId } }),
    ]);

    if (!city) {
      throw new AppError('City not found', 404);
    }

    if (!clinic) {
      throw new AppError('Clinic not found', 404);
    }

    const existingSlug = await prisma.surgeonProfile.findUnique({
      where: { slug: this.createSlug(name) },
    });

    if (existingSlug) {
      throw new AppError('Profile slug already in use', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'SURGEON',
          emailVerified: true,
          avatarUrl: avatarUrl || null,
          phone: phone || null,
        },
      });

      const profile = await tx.surgeonProfile.create({
        data: {
          userId: user.id,
          clinicId,
          cityId,
          name,
          slug: this.createSlug(name),
          specialization,
          experience: `${experienceYears} years of experience`,
          experienceYears: parseInt(experienceYears, 10),
          language,
          patientApproach,
          bio: bio || null,
          address: address || null,
          availability: availability || null,
          boardRegistrationNumber: boardRegistrationNumber || null,
          governmentIDFrontUrl: governmentIDFrontUrl || null,
          governmentIDBackUrl: governmentIDBackUrl || null,
          certificateUrls: certificateUrls || null,
          education: education || [],
          areasExpertise: areasExpertise || [],
          certifications: certifications || [],
          procedures: procedures || null,
          isVerified: false,
          surgeonPhotos: {
            create: (imageUrls || []).map((url, index) => ({
              url: url,
              order: index,
            })),
          },
        },
      });
      const tokens = generateTokenPair(user);
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus: user.verificationStatus,
          paymentStatus: user.paymentStatus,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    });

    emailEmitter.emit('user-registered', {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    });

    return result;
  }

  async getSurgeonProfilesWebsite(filterDTO) {
    const {
      sortBy,
      sortOrder,
      search,
      limit,
      clinic,
      specialization,
      city,
      status = 'APPROVED',
      paymentStatus = 'ACTIVE',
    } = filterDTO;

    const allowedSortFields = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'experienceYears',
      'status',
      'paymentStatus',
    ]);

    const normalizedSortBy = allowedSortFields.has(sortBy)
      ? sortBy
      : 'createdAt';
    const normalizedSortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const offset = filterDTO.getOffset();
    const whereCondition = [];

    // 1. Filter: Text search across Name and Address
    if (search) {
      whereCondition.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // 2. Filter: Specialization
    if (specialization) {
      whereCondition.push({ specialization: specialization });
    }

    // 3. Filter: Clinic via unique slug reference matching
    if (clinic) {
      whereCondition.push({ clinic: { slug: clinic } });
    }

    // 4. Filter: City via unique slug reference matching
    if (city) {
      whereCondition.push({ city: { slug: city } });
    }

    // 5. Filter: Payment Status
    if (paymentStatus) {
      whereCondition.push({ paymentStatus: paymentStatus });
    }

    // 6. Filter: Lifecycle Surgeon Status
    if (status) {
      whereCondition.push({ status: status });
    }

    const finalWhere = whereCondition.length > 0 ? { AND: whereCondition } : {};

    const [profiles, total] = await Promise.all([
      prisma.surgeonProfile.findMany({
        where: finalWhere,
        include: {
          city: {
            select: { id: true, name: true },
          },
          clinic: {
            select: { id: true, name: true },
          },
          surgeonPhotos: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          currentSubscription: {
            include: {
              tier: true,
            },
          },
        },
        orderBy: [
          {
            [normalizedSortBy]: normalizedSortOrder,
          },
          {
            currentSubscription: {
              tier: {
                price: 'desc',
              },
            },
          },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.surgeonProfile.count({ where: finalWhere }),
    ]);

    const normalizedProfiles = profiles.map((profile) => {
      return {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        email: profile.user?.email || null,
        specialization: profile.specialization,
        experienceYears: profile.experienceYears,
        language: profile.language,
        
        city: profile.city?.name || null,
        clinic: profile.clinic?.name || null,
        availability: profile.availability || null,
        address: profile.address || null,
        bio: profile.bio || null,
        isVerified: profile.isVerified,
        ratings: profile.ratings || 0,
        totalReviews: profile.totalReviews || 0,
        status: profile.status,
        paymentStatus: profile.paymentStatus,
        thumbnailImage: profile.user.avatarUrl
          ? profile.user.avatarUrl
          : profile.surgeonPhotos?.[0]?.url || null,
      };
    });

    return {
      data: normalizedProfiles,
      pagination: {
        currentPage: filterDTO.page,
        itemsPerPage: filterDTO.limit,
        totalItems: total,
        totalPages: Math.ceil(total / filterDTO.limit),
        hasNextPage: filterDTO.page < Math.ceil(total / filterDTO.limit),
        hasPreviousPage: filterDTO.page > 1,
      },
    };
  }

  async searchSurgeonsByName(searchString, limit = 10) {
    const queryLimit = parseInt(limit, 10) || 10;
    const buildWhereClause = {};

    if (searchString && searchString.trim() !== '') {
      const cleanSearch = searchString.trim();
      buildWhereClause.name = {
        contains: cleanSearch,
        mode: 'insensitive',
      };
    }

    buildWhereClause.status = 'APPROVED';
    buildWhereClause.paymentStatus = 'ACTIVE';

    const result = await prisma.surgeonProfile.findMany({
      where: buildWhereClause,
      take: queryLimit,
      select: {
        id: true,
        name: true,
        slug: true,
        city: {
          select: { name: true, slug: true },
        },
        clinic: {
          select: { name: true, slug: true },
        },
        specialization: true,
        currentSubscription: {
          select: {
            tier: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          currentSubscription: {
            tier: {
              price: 'desc',
            },
          },
        },
      ],
    });

    return result.map((profile) => ({
      id: profile.id,
      name: profile.name,
      slug: profile.slug,
      specialization: profile.specialization,
      city: profile.city || null,
      clinic: profile.clinic || null,
      // subscriptionPlan: profile.currentSubscription?.tier.name || null,
    }));
  }

  async getSurgeonProfilesAdmin(filterDTO) {
    const {
      sortBy,
      sortOrder,
      search,
      limit,
      paymentStatus,
      clinic,
      specialization,
      city,
      status,
    } = filterDTO;

    const offset = filterDTO.getOffset();
    const whereCondition = [];

    if (search) {
      whereCondition.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (specialization) {
      whereCondition.push({ specialization: specialization });
    }

    if (clinic) {
      whereCondition.push({ clinic: { slug: clinic } });
    }

    if (city) {
      whereCondition.push({ city: { slug: city } });
    }

    if (paymentStatus) {
      whereCondition.push({ paymentStatus: paymentStatus });
    }

    if (status) {
      whereCondition.push({ status: status });
    }

    const finalWhere = whereCondition.length > 0 ? { AND: whereCondition } : {};

    const [profiles, total] = await Promise.all([
      prisma.surgeonProfile.findMany({
        where: finalWhere,
        include: {
          city: {
            select: { id: true, name: true },
          },
          clinic: {
            select: { id: true, name: true },
          },
          surgeonPhotos: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          currentSubscription: {
            include: {
              tier: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.surgeonProfile.count({ where: finalWhere }),
    ]);

    const normalizedProfiles = profiles.map((profile) => {
      return {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        email: profile.user?.email || null,
        specialization: profile.specialization,
        experienceYears: profile.experienceYears,
        language: profile.language,
        city: profile.city?.name || null,
        clinic: profile.clinic?.name || null,
        availability: profile.availability || null,
        address: profile.address || null,
        bio: profile.bio || null,
        isVerified: profile.isVerified,
        status: profile.status,
        joinedAt: profile.createdAt,
        subscriptionPlan: profile.currentSubscription?.tier.name || null,
        subscriptionDate: profile.currentSubscription?.startDate || null,
        subscriptionEndDate: profile.currentSubscription?.endDate || null,
        paymentStatus: profile.paymentStatus,
        thumbnailImage: profile.user.avatarUrl
          ? profile.user.avatarUrl
          : profile.surgeonPhotos?.[0]?.url || null,
      };
    });

    return {
      data: normalizedProfiles,
      pagination: {
        currentPage: filterDTO.page,
        itemsPerPage: filterDTO.limit,
        totalItems: total,
        totalPages: Math.ceil(total / filterDTO.limit),
        hasNextPage: filterDTO.page < Math.ceil(total / filterDTO.limit),
        hasPreviousPage: filterDTO.page > 1,
      },
    };
  }

  async getProfileById(id) {
    const profile = await prisma.surgeonProfile.findUnique({
      where: { id },
      include: {
        city: true,
        clinic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            phone: true,
          },
        },
        surgeonPhotos: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }

    return profile;
  }

  async getProfileByMy(userId) {
    const profile = await prisma.surgeonProfile.findUnique({
      where: { userId },
      include: {
        city: true,
        clinic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
          },
        },
        surgeonPhotos: {
          orderBy: { order: 'asc' },
        },
        currentSubscription: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError('My profile not found', 404);
    }

    return profile;
  }

  async getProfileBySlug(slug) {
    const profile = await prisma.surgeonProfile.findUnique({
      where: { slug },
      include: {
        city: true,
        clinic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        surgeonPhotos: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }

    return profile;
  }

  async updateSurgeonProfile(id, fileUrls, data) {
    const existingProfile = await prisma.surgeonProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingProfile) {
      throw new Error('Surgeon profile not found');
    }

    const dtoData = { ...data };
    const userData = {};

    if (dtoData.name !== undefined) {
      userData.name = dtoData.name;
    }

    if (dtoData.email !== undefined) {
      userData.email = dtoData.email.toLowerCase();
      delete dtoData.email;
    }

    if (fileUrls.governmentIDFrontUrl)
      dtoData.governmentIDFrontUrl = fileUrls.governmentIDFrontUrl;
    if (fileUrls.governmentIDBackUrl)
      dtoData.governmentIDBackUrl = fileUrls.governmentIDBackUrl;
    if (fileUrls.certificateUrls)
      dtoData.certificateUrls = fileUrls.certificateUrls;

    delete dtoData.id;
    delete dtoData.userId;
    delete dtoData.createdAt;
    delete dtoData.updatedAt;

    return await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existingProfile.userId },
          data: userData,
        });
      }

      if (Array.isArray(fileUrls.imageUrls) && fileUrls.imageUrls.length > 0) {
        const lastPhoto = await tx.surgeonPhotos.findFirst({
          where: { surgeonId: id },
          select: { order: true },
          orderBy: { order: 'desc' },
        });

        const startOrder = lastPhoto ? lastPhoto.order + 1 : 0;

        await tx.surgeonPhotos.createMany({
          data: fileUrls.imageUrls.map((url, index) => ({
            surgeonId: id,
            url: url,
            order: startOrder + index,
          })),
        });
      }

      return await tx.surgeonProfile.update({
        where: { id },
        data: dtoData,
        include: {
          city: true,
          clinic: true,
          surgeonPhotos: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  async updateVendorStatus(id, data) {
    const profile = await this.getProfileById(id);
    const result = prisma.surgeonProfile.update({
      where: { id },
      data: { status: data.status, paymentStatus: data.paymentStatus },
    });

    const userData = {
      id: profile.userId,
      name: profile.name,
      email: profile.user?.email || null,
    };

    const statusUpdateDetails = {
      status: data.status,
      reason: data.rejectionReason || null,
    };
    emailEmitter.emit('surgeon-status-changed', {
      userData,
      statusUpdateDetails,
    });
    return result;
  }

  async deleteVendorProfile(id) {
    await this.getProfileById(id);

    await prisma.surgeonProfile.delete({
      where: { id },
    });

    return true;
  }

  async deletePortfolioImage(imageId) {
    const image = await prisma.surgeonProfile.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new AppError('Portfolio image not found', 404);
    }

    await prisma.surgeonProfile.delete({
      where: { id: imageId },
    });

    return true;
  }

  async vendorSubscriptionPlanChange(vendorId, newPackageId) {
    const vendorProfile = await this.getVendorProfileById(vendorId);
    const currentSubscription = await prisma.vendorSubscription.findUnique({
      where: { id: vendorProfile.currentSubscriptionId },
      include: {
        vendor: {
          select: {
            stripeCustomerId: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!currentSubscription) {
      throw new AppError('Current subscription not found', 404);
    }
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPackageId },
    });

    if (!newPlan) {
      throw new AppError('New subscription plan not found', 404);
    }

    if (currentSubscription.planId === newPackageId) {
      throw new AppError('Already subscribed to this plan', 400);
    }

    if (Number(newPlan.priceMonthly) > 0) {
      return await this.paymentService.createSubscriptionUpdateSession({
        vendorId,
        currentSubscription,
        newPlan,
      });
    } else {
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(startsAt.getDate() + 30);

      await prisma.$transaction(async (tx) => {
        await tx.vendorSubscription.update({
          where: { id: currentSubscription.id },
          data: { status: 'INACTIVE' },
        });
        const newSubscription = await tx.vendorSubscription.create({
          data: {
            vendorId,
            planId: newPackageId,
            status: 'ACTIVE',
            startsAt,
            endsAt,
          },
        });
        await tx.vendorProfile.update({
          where: { id: vendorId },
          data: {
            currentSubscriptionId: newSubscription.id,
            stripeCustomerId: null,
          },
        });
      });
    }

    return newPlan;
  }
}

module.exports = surgeonProfileService;
