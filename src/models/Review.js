const { prisma } = require('../database/connection');

const PUBLIC_INCLUDE = {
  user: { select: { firstName: true, lastName: true, username: true } },
  course: { select: { id: true, title: true, titleRu: true, titleEn: true } },
};

const toPublic = (r) => ({
  id: r.id,
  rating: r.rating,
  text: r.text,
  createdAt: r.createdAt,
  courseId: r.course?.id,
  courseTitle: r.course?.title,
  courseTitleRu: r.course?.titleRu,
  courseTitleEn: r.course?.titleEn,
  author: [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || r.user?.username || "O'quvchi",
});

const Review = {
  async listPublic({ courseId, take = 50 } = {}) {
    const rows = await prisma.review.findMany({
      where: { isVisible: true, ...(courseId ? { courseId } : {}) },
      include: PUBLIC_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map(toPublic);
  },

  listByUser(userId) {
    return prisma.review.findMany({ where: { userId }, select: { courseId: true, rating: true, text: true } });
  },

  upsert(userId, courseId, { rating, text }) {
    return prisma.review.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { rating, text },
      create: { userId, courseId, rating, text },
    });
  },

  listAll() {
    return prisma.review.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, username: true, phone: true } },
        course: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  },

  setVisible(id, isVisible) {
    return prisma.review.update({ where: { id }, data: { isVisible } });
  },

  remove(id) {
    return prisma.review.delete({ where: { id } });
  },

  count() {
    return prisma.review.count();
  },
};

module.exports = Review;
