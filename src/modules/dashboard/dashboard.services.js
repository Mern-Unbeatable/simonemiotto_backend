const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class DashboardService {
  #monthsArray = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'July',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  #parseYearFromFilter(filterInput) {
    const currentYear = new Date().getFullYear();

    if (filterInput === 'this_year' || !filterInput) {
      return currentYear;
    }

    if (filterInput === 'previous_year') {
      return currentYear - 1;
    }
    const parsedYear = parseInt(filterInput, 10);
    return isNaN(parsedYear) ? currentYear : parsedYear;
  }

  async getDashboardCardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalSurgeons,
      pendingApprovals,
      verifiedSurgeons,
      expiredSubscriptions,
      monthlyRevenueAgg,
      totalRevenueAgg,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.surgeonProfile.count(),

      prisma.surgeonProfile.count({
        where: { status: 'PENDING' },
      }),

      prisma.surgeonProfile.count({
        where: { status: 'APPROVED' },
      }),

      prisma.surgeonProfile.count({
        where: { currentSubscription: { endDate: { lt: new Date() } } },
      }),

      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.surgeonProfile.count({
        where: { currentSubscription: { status: 'ACTIVE' } },
      }),
    ]);
    const finalMonthlyRevenue = monthlyRevenueAgg._sum.amount
      ? Number(monthlyRevenueAgg._sum.amount)
      : 0;
    const finalTotalRevenue = totalRevenueAgg._sum.amount
      ? Number(totalRevenueAgg._sum.amount)
      : 0;

    return {
      totalSurgeons,
      pendingApprovals,
      verifiedSurgeons,
      expiredSubscriptions,
      monthlyRevenue: finalMonthlyRevenue,
      totalRevenue: finalTotalRevenue,
      activeSubscriptions,
    };
  }

  async getSalesPerformance(yearFilter) {
    const targetYear = this.#parseYearFromFilter(yearFilter);

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const salesMap = this.#monthsArray.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    payments.forEach((payment) => {
      const monthIndex = new Date(payment.createdAt).getMonth();
      const monthName = this.#monthsArray[monthIndex];
      salesMap[monthName] += Number(payment.amount) || 0;
    });

    return Object.keys(salesMap).map((month) => ({
      month,
      sales: Math.round(salesMap[month]),
    }));
  }

  async getSurgeonRegistrations(yearFilter) {
    const targetYear = this.#parseYearFromFilter(yearFilter);

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const surgeons = await prisma.surgeonProfile.findMany({
      where: {
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        createdAt: true,
      },
    });

    const registrationMap = this.#monthsArray.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    surgeons.forEach((surgeon) => {
      const monthIndex = new Date(surgeon.createdAt).getMonth();
      const monthName = this.#monthsArray[monthIndex];
      registrationMap[monthName] += 1;
    });

    return Object.keys(registrationMap).map((month) => ({
      month,
      count: registrationMap[month],
    }));
  }

  async getCombinedDashboardData() {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const [allYearPayments, recentPaymentsList] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfYear, lte: endOfYear },
        },
        include: {
          subscription: {
            include: { tier: true },
          },
        },
      }),

      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          subscription: {
            include: {
              tier: true,
              surgeonProfile: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    const growthMap = this.#monthsArray.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    allYearPayments.forEach((payment) => {
      const monthIndex = new Date(payment.createdAt).getMonth();
      const monthName = this.#monthsArray[monthIndex];
      growthMap[monthName] += Number(payment.amount) || 0;
    });

    const revenueGrowth = Object.keys(growthMap).map((month) => ({
      month,
      amount: Math.round(growthMap[month]),
    }));

    const planMap = {};
    let totalRevenueSum = 0;

    allYearPayments.forEach((payment) => {
      const planName = payment.subscription?.tier?.name || 'Unknown';
      const amount = Number(payment.amount) || 0;

      if (!planMap[planName]) {
        planMap[planName] = 0;
      }
      planMap[planName] += amount;
      totalRevenueSum += amount;
    });

    const revenueByPlan = Object.keys(planMap)
      .map((planName) => {
        const amount = planMap[planName];
        const percentage =
          totalRevenueSum > 0
            ? Math.round((amount / totalRevenueSum) * 100)
            : 0;
        return {
          planName,
          percentage,
          amount: Math.round(amount),
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    const recentPayments = recentPaymentsList.map((payment) => ({
      id: payment.id,
      surgeonName:
        payment.subscription?.surgeonProfile?.name || 'Unknown Surgeon',
      planName: payment.subscription?.tier?.name || 'N/A',
      amount: Number(payment.amount),
      date: payment.createdAt.toISOString().split('T')[0],
      status: payment.status === 'SUCCESS' ? 'Success' : 'pending',
    }));

    return {
      revenueGrowth,
      revenueByPlan,
      recentPayments,
    };
  }

  async getDemographicAnalytics(startDateParam, endDateParam) {
    const dateFilter = {};
    if (startDateParam) dateFilter.gte = new Date(startDateParam);
    if (endDateParam)
      dateFilter.lte = new Date(`${endDateParam}T23:59:59.999Z`);

    const whereClause = {};
    if (startDateParam || endDateParam) {
      whereClause.createdAt = dateFilter;
    }
    const [surgeons, specializationGroups] = await Promise.all([
      prisma.surgeonProfile.findMany({
        where: whereClause,
        select: {
          city: {
            select: { name: true },
          },
        },
      }),

      prisma.surgeonProfile.groupBy({
        by: ['specialization'],
        where: whereClause,
        _count: {
          id: true,
        },
      }),
    ]);

    const cityMap = {};
    surgeons.forEach((surgeon) => {
      const cityName = surgeon.city?.name || 'Unknown';
      cityMap[cityName] = (cityMap[cityName] || 0) + 1;
    });

    const surgeonsByCity = Object.keys(cityMap)
      .map((city) => ({
        city,
        count: cityMap[city],
      }))
      .sort((a, b) => b.count - a.count);

    const totalSurgeonsCount = specializationGroups.reduce(
      (sum, item) => sum + item._count.id,
      0,
    );

    const surgeonsBySpecialization = specializationGroups
      .map((item) => {
        const count = item._count.id;
        const percentage =
          totalSurgeonsCount > 0
            ? parseFloat(((count / totalSurgeonsCount) * 100).toFixed(2))
            : 0;
        return {
          specialization: item.specialization,
          count,
          percentage,
        };
      })
      .sort((a, b) => b.count - a.count);

    const topSpecializations = surgeonsBySpecialization
      .slice(0, 5)
      .map((item) => ({
        specialization: item.specialization,
        count: item.count,
      }));

    return {
      surgeonsByCity,
      surgeonsBySpecialization,
      topSpecializations,
    };
  }
}

module.exports = DashboardService;
