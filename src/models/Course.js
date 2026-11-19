const { prisma } = require('../database/connection');

/** Mijozlarga ko'rsatiladigan maydonlar (accessLink yashirin) */
const PUBLIC_SELECT = {
  id: true,
  title: true,
  titleRu: true,
  titleEn: true,
  description: true,
  descriptionRu: true,
  descriptionEn: true,
  categoryRu: true,
  categoryEn: true,
  programRu: true,
  programEn: true,
  durationRu: true,
  durationEn: true,
  levelRu: true,
  levelEn: true,
  imageUrl: true,
  oldPrice: true,
  price: true,
  category: true,
  program: true,
  lessonsCount: true,
  duration: true,
  level: true,
  badge: true,
};

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

const Course = {
  async listPublic() {
    const [courses, ratings] = await Promise.all([
      prisma.course.findMany({ where: { isActive: true }, select: PUBLIC_SELECT, orderBy: ORDER_BY }),
      prisma.review.groupBy({
        by: ['courseId'],
        where: { isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    const map = new Map(ratings.map((r) => [r.courseId, r]));
    return courses.map((c) => {
      const r = map.get(c.id);
      return {
        ...c,
        rating: r ? Math.round(r._avg.rating * 10) / 10 : null,
        reviewsCount: r ? r._count._all : 0,
      };
    });
  },

  listAll() {
    return prisma.course.findMany({ orderBy: ORDER_BY });
  },

  findManyActive(ids) {
    return prisma.course.findMany({ where: { id: { in: ids }, isActive: true } });
  },

  findById(id) {
    return prisma.course.findUnique({ where: { id } });
  },

  findMany(ids) {
    return prisma.course.findMany({ where: { id: { in: ids } } });
  },

  create(data) {
    return prisma.course.create({ data });
  },

  update(id, data) {
    return prisma.course.update({ where: { id }, data });
  },

  remove(id) {
    return prisma.course.delete({ where: { id } });
  },
};

module.exports = Course;
