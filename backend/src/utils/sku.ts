import { prisma } from '../config/database';

export const generateSKU = async (name: string, categoryId?: string): Promise<string> => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const sku = `${prefix}-${timestamp}-${random}`;

  // Ensure uniqueness
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) return generateSKU(name, categoryId);
  return sku;
};
