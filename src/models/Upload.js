const { prisma } = require('../database/connection');

const Upload = {
  create({ mimeType, data }) {
    return prisma.upload.create({ data: { mimeType, data, size: data.length }, select: { id: true } });
  },
  findById(id) {
    return prisma.upload.findUnique({ where: { id } });
  },
};

module.exports = Upload;
