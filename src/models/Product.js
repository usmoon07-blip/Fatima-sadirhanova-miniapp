const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

function sanitizeSizes(sizes) {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((s) => ({ label: String(s.label || '').trim(), price: Math.round(Number(s.price) || 0) }))
    .filter((s) => s.label && s.price > 0);
}

function toData(input) {
  const data = { ...input };
  if ('sizes' in data) data.sizes = sanitizeSizes(data.sizes);
  if ('ingredients' in data) {
    data.ingredients = (data.ingredients || []).map((i) => String(i).trim()).filter(Boolean);
  }
  if ('categoryId' in data) data.categoryId = data.categoryId ? Number(data.categoryId) : null;
  return data;
}

const Product = {
  listAvailable() {
    return prisma.product.findMany({ where: { isAvailable: true }, orderBy: ORDER_BY });
  },

  listAll() {
    return prisma.product.findMany({ orderBy: ORDER_BY, include: { category: { select: { id: true, name: true } } } });
  },

  findManyByIds(ids) {
    return prisma.product.findMany({ where: { id: { in: ids } } });
  },

  create(input) {
    return prisma.product.create({ data: toData(input) });
  },

  update(id, input) {
    return prisma.product.update({ where: { id }, data: toData(input) });
  },

  remove(id) {
    return prisma.product.delete({ where: { id } });
  },

  /** Variant (o'lcham) bo'yicha birlik narxini aniqlaydi */
  unitPrice(product, sizeLabel) {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    if (sizes.length === 0) return { price: product.price, size: null };
    const found = sizes.find((s) => s.label === sizeLabel) || sizes[0];
    return { price: found.price, size: found.label };
  },
};

module.exports = Product;
