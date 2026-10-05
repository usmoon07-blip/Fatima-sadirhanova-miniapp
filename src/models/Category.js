const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

const Category = {
  listActive() {
    return prisma.category.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
  },
  listAll() {
    return prisma.category.findMany({ orderBy: ORDER_BY, include: { _count: { select: { products: true } } } });
  },
  create(data) {
    return prisma.category.create({ data });
  },
  update(id, data) {
    return prisma.category.update({ where: { id }, data });
  },
  remove(id) {
    return prisma.category.delete({ where: { id } });
  },
};

module.exports = Category;
