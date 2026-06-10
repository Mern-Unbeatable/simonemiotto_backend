const { prisma } = require('../../config/database');

class ReviewDAO {
  async createReview(reviewData, patientId) {
    const { rating, comment, surgeonProfileId } = reviewData;

    return await prisma.review.create({
      data: {
        rating: parseInt(rating, 10),
        comment: comment || null,
        patientId,
        surgeonProfileId,
      },
      include: {
        patient: { select: { name: true } },
      },
    });
  }

  async createReview(reviewData, patientId) {
    const { rating, comment, surgeonProfileId } = reviewData;

    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          rating: parseInt(rating, 10),
          comment: comment || null,
          patientId,
          surgeonProfileId,
        },
        include: {
          patient: {
            select: {
              name: true,
            },
          },
        },
      });

      const stats = await tx.review.aggregate({
        where: {
          surgeonProfileId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      });

      await tx.surgeonProfile.update({
        where: {
          id: surgeonProfileId,
        },
        data: {
          ratings: stats._avg.rating || 0,
          totalReviews: stats._count.rating,
        },
      });

      return review;
    });
  }

  async getReviewById(id) {
    return await prisma.review.findUnique({
      where: { id },
      include: {
        patient: { select: { name: true } },
        surgeonProfile: { select: { name: true } },
      },
    });
  }

  async getReviewsBySurgeon(surgeonProfileId, filterDTO) {
    const { sortBy, sortOrder, limit } = filterDTO;

    const offset = filterDTO.getOffset();

    const reviews = await prisma.review.findMany({
      where: { surgeonProfileId },
      include: {
        patient: {
          select: { name: true, avatarUrl: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    const total = await prisma.review.count({
      where: { surgeonProfileId },
    });

    const normalizedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment || '',
      patientName: review.patient?.name || 'Anonymous Patient',
      patientAvatar: review.patient?.avatarUrl || null,
      date: review.createdAt.toISOString().split('T')[0],
    }));

    return {
      data: normalizedReviews,
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

  async updateReview(id, updateData) {
    const { rating, comment } = updateData;

    return await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating: parseInt(rating, 10) }),
        ...(comment !== undefined && { comment: comment || null }),
      },
    });
  }

  async deleteReview(id) {
    return await prisma.review.delete({
      where: { id },
    });
  }
}

module.exports = ReviewDAO;
