const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];
const LIST_FIELDS = ['program', 'programRu', 'programEn'];

function toData(input) {
  const data = { ...input };
  for (const key of LIST_FIELDS) {
    if (key in data) data[key] = (data[key] || []).map((s) => String(s).trim()).filter(Boolean);
  }
  return data;
}

const Course = {
  listActive() {
    return prisma.course.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
  },
  listAll() {
    return prisma.course.findMany({ orderBy: ORDER_BY, include: { _count: { select: { enrollments: true } } } });
  },
  findById(id) {
    return prisma.course.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.course.create({ data: toData(data) });
  },
  update(id, data) {
    return prisma.course.update({ where: { id }, data: toData(data) });
  },
  remove(id) {
    return prisma.course.delete({ where: { id } });
  },
  /** Tanlangan format narxi (format mavjud bo'lmasa null) */
  priceFor(course, format) {
    return format === 'ONLINE' ? course.onlinePrice : course.offlinePrice;
  },
};

module.exports = Course;
