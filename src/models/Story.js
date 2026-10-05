const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

const Story = {
  listActive() {
    return prisma.story.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
  },
  listAll() {
    return prisma.story.findMany({ orderBy: ORDER_BY });
  },
  create(data) {
    return prisma.story.create({ data });
  },
  update(id, data) {
    return prisma.story.update({ where: { id }, data });
  },
  remove(id) {
    return prisma.story.delete({ where: { id } });
  },
};

module.exports = Story;
