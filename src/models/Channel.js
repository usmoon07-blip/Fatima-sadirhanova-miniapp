const { prisma } = require('../database/connection');

const Channel = {
  upsert({ id, title, username, canInvite, isActive }) {
    const data = { title, username: username || null, canInvite: Boolean(canInvite), isActive: Boolean(isActive) };
    return prisma.channel.upsert({ where: { id: String(id) }, update: data, create: { id: String(id), ...data } });
  },
  listActive() {
    return prisma.channel.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' } });
  },
  findById(id) {
    return prisma.channel.findUnique({ where: { id: String(id) } });
  },
};

module.exports = Channel;
