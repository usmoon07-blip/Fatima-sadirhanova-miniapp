const { prisma } = require('../database/connection');

const USER_SELECT = { select: { telegramId: true, firstName: true, lastName: true, username: true, language: true } };
const COURSE_SELECT = { select: { id: true, title: true, titleRu: true, titleEn: true, imageUrl: true } };

const Enrollment = {
  create(data) {
    return prisma.enrollment.create({ data, include: { user: USER_SELECT, course: COURSE_SELECT } });
  },
  findById(id) {
    return prisma.enrollment.findUnique({ where: { id }, include: { user: USER_SELECT, course: COURSE_SELECT } });
  },
  listByUser(userId) {
    return prisma.enrollment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { course: COURSE_SELECT } });
  },
  list({ status } = {}) {
    const where = status && status !== 'ALL' ? { status } : {};
    return prisma.enrollment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300, include: { user: USER_SELECT, course: COURSE_SELECT } });
  },
  updateStatus(id, status) {
    return prisma.enrollment.update({ where: { id }, data: { status }, include: { user: USER_SELECT, course: COURSE_SELECT } });
  },
  /** Faqat yangi (NEW) arizani bekor qiladi — poyga holatidan himoyalangan */
  async cancelIfNew(id, userId) {
    const r = await prisma.enrollment.updateMany({ where: { id, userId, status: 'NEW' }, data: { status: 'CANCELLED' } });
    return r.count > 0;
  },
  remove(id) {
    return prisma.enrollment.delete({ where: { id } });
  },
  countNew() {
    return prisma.enrollment.count({ where: { status: 'NEW' } });
  },
};

module.exports = Enrollment;
