const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'desc' }];

const Result = {
  listActive() {
    return prisma.result.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
  },
  listAll() {
    return prisma.result.findMany({ orderBy: ORDER_BY });
  },
  create(data) {
    return prisma.result.create({ data });
  },
  update(id, data) {
    return prisma.result.update({ where: { id }, data });
  },
  remove(id) {
    return prisma.result.delete({ where: { id } });
  },
};

module.exports = Result;
