import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createError } from '../utils/errors';
import { generateSKU } from '../utils/sku';
import { logActivity } from '../utils/activity';
import * as XLSX from 'xlsx';

export const getProducts = async (req: Request, res: Response) => {
  const {
    page = 1, limit = 20, search, categoryId, supplierId,
    lowStock, outOfStock, sortBy = 'createdAt', sortOrder = 'desc',
    tags
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { sku: { contains: String(search), mode: 'insensitive' } },
      { barcode: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = String(categoryId);
  if (supplierId) where.supplierId = String(supplierId);
  if (tags) where.tags = { hasSome: String(tags).split(',') };

  const products = await prisma.product.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: { [String(sortBy)]: sortOrder },
    include: {
      category: { select: { id: true, name: true, color: true } },
      supplier: { select: { id: true, name: true } },
      inventoryItems: {
        include: { warehouse: { select: { id: true, name: true } } },
      },
    },
  });

  // Calculate total stock per product
  const enriched = products.map(p => ({
    ...p,
    totalStock: p.inventoryItems.reduce((sum, i) => sum + i.quantity, 0),
  }));

  let filtered = enriched;
  if (lowStock === 'true') {
    filtered = enriched.filter(p => p.totalStock > 0 && p.totalStock <= p.reorderPoint);
  }
  if (outOfStock === 'true') {
    filtered = enriched.filter(p => p.totalStock === 0);
  }

  const total = await prisma.product.count({ where });

  res.json({
    success: true,
    data: filtered,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      supplier: true,
      inventoryItems: { include: { warehouse: true } },
      stockMovements: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
      batchLots: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!product) throw createError('Product not found', 404);
  res.json({ success: true, data: product });
};

export const createProduct = async (req: Request, res: Response) => {
  const data = req.body;
  const userId = (req as any).userId;

  // Auto-generate SKU if not provided
  if (!data.sku) {
    data.sku = await generateSKU(data.name, data.categoryId);
  }

  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw createError('SKU already exists', 409);

  const product = await prisma.product.create({
    data: {
      ...data,
      tags: data.tags || [],
      images: data.images || [],
    },
    include: { category: true, supplier: true },
  });

  await logActivity(userId, 'CREATE', 'PRODUCT', product.id, undefined, product);

  // Create initial inventory if warehouseId provided
  if (data.warehouseId && data.initialStock) {
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        warehouseId: data.warehouseId,
        quantity: data.initialStock,
        availableQty: data.initialStock,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: 'IN',
        quantity: data.initialStock,
        toWarehouseId: data.warehouseId,
        reference: 'INITIAL_STOCK',
        userId,
      },
    });
  }

  res.status(201).json({ success: true, data: product });
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).userId;

  const old = await prisma.product.findUnique({ where: { id } });
  if (!old) throw createError('Product not found', 404);

  const product = await prisma.product.update({
    where: { id },
    data: req.body,
    include: { category: true, supplier: true },
  });

  await logActivity(userId, 'UPDATE', 'PRODUCT', id, old, product);
  res.json({ success: true, data: product });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).userId;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw createError('Product not found', 404);

  // Soft delete by setting isActive = false
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  await logActivity(userId, 'DELETE', 'PRODUCT', id, product);

  res.json({ success: true, message: 'Product deleted successfully' });
};

export const bulkImport = async (req: Request, res: Response) => {
  if (!req.file) throw createError('File required', 400);
  const userId = (req as any).userId;

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet) as any[];

  const results = { created: 0, errors: [] as any[] };

  for (const row of rows) {
    try {
      const sku = row.sku || await generateSKU(row.name, '');
      await prisma.product.upsert({
        where: { sku },
        update: {
          name: row.name,
          costPrice: Number(row.costPrice) || 0,
          sellingPrice: Number(row.sellingPrice) || 0,
        },
        create: {
          name: row.name,
          sku,
          costPrice: Number(row.costPrice) || 0,
          sellingPrice: Number(row.sellingPrice) || 0,
          minStockLevel: Number(row.minStockLevel) || 10,
          tags: [],
          images: [],
        },
      });
      results.created++;
    } catch (err: any) {
      results.errors.push({ row: row.name, error: err.message });
    }
  }

  await logActivity(userId, 'BULK_IMPORT', 'PRODUCT', undefined, undefined, results);
  res.json({ success: true, data: results });
};

export const exportProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true, supplier: true, inventoryItems: true },
  });

  const data = products.map(p => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.category?.name || '',
    Supplier: p.supplier?.name || '',
    CostPrice: p.costPrice,
    SellingPrice: p.sellingPrice,
    TotalStock: p.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    MinStockLevel: p.minStockLevel,
    ReorderPoint: p.reorderPoint,
    Barcode: p.barcode || '',
    Tags: p.tags.join(', '),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
  res.send(buffer);
};

export const generateQR = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw createError('Product not found', 404);

  const QRCode = require('qrcode');
  const qrData = JSON.stringify({ id: product.id, sku: product.sku, name: product.name });
  const qrImage = await QRCode.toDataURL(qrData);

  res.json({ success: true, data: { qrCode: qrImage, product: { id: product.id, sku: product.sku } } });
};
