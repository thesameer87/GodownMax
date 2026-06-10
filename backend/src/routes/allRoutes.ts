import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../config/database';
import { authenticate, isAdminOrManager, isAdmin } from '../middleware/auth';
import { createError } from '../utils/errors';
import { logActivity } from '../utils/activity';

// ===== USERS ROUTER =====
export const usersRouter = Router();
usersRouter.use(authenticate);

usersRouter.get('/', isAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
});

usersRouter.put('/:id', isAdmin, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  res.json({ success: true, data: user });
});

usersRouter.delete('/:id', isAdmin, async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: 'User deactivated' });
});

// ===== CATEGORIES ROUTER =====
export const categoriesRouter = Router();
categoriesRouter.use(authenticate);

categoriesRouter.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: categories });
});

categoriesRouter.post('/', isAdminOrManager, async (req, res) => {
  const { name, description, color, icon } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const cat = await prisma.category.create({ data: { name, slug, description, color, icon } });
  res.status(201).json({ success: true, data: cat });
});

categoriesRouter.put('/:id', isAdminOrManager, async (req, res) => {
  const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: cat });
});

categoriesRouter.delete('/:id', isAdminOrManager, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Category deleted' });
});

// ===== WAREHOUSES ROUTER =====
export const warehousesRouter = Router();
warehousesRouter.use(authenticate);

warehousesRouter.get('/', async (req, res) => {
  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { inventoryItems: true } } },
  });
  res.json({ success: true, data: warehouses });
});

warehousesRouter.post('/', isAdminOrManager, async (req, res) => {
  const wh = await prisma.warehouse.create({ data: req.body });
  res.status(201).json({ success: true, data: wh });
});

warehousesRouter.put('/:id', isAdminOrManager, async (req, res) => {
  const wh = await prisma.warehouse.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: wh });
});

// ===== INVENTORY ROUTER =====
export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

inventoryRouter.get('/', async (req, res) => {
  const { warehouseId, productId, page = 1, limit = 20 } = req.query;
  const where: any = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;

  const items = await prisma.inventoryItem.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: {
      product: { include: { category: true } },
      warehouse: true,
    },
  });
  const total = await prisma.inventoryItem.count({ where });
  res.json({ success: true, data: items, pagination: { total, page: Number(page), limit: Number(limit) } });
});

inventoryRouter.post('/adjust', isAdminOrManager, async (req, res) => {
  const { productId, warehouseId, quantity, type, notes } = req.body;
  const userId = (req as any).userId;

  const item = await prisma.inventoryItem.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });

  const currentQty = item?.quantity || 0;
  const newQty = type === 'IN' ? currentQty + quantity : Math.max(0, currentQty - quantity);

  await prisma.inventoryItem.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    create: { productId, warehouseId, quantity: newQty, availableQty: newQty },
    update: { quantity: newQty, availableQty: newQty },
  });

  await prisma.stockMovement.create({
    data: { productId, type, quantity, toWarehouseId: type === 'IN' ? warehouseId : undefined,
      fromWarehouseId: type === 'OUT' ? warehouseId : undefined, notes, userId },
  });

  res.json({ success: true, message: 'Stock adjusted' });
});

inventoryRouter.post('/transfer', isAdminOrManager, async (req, res) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
  const userId = (req as any).userId;

  const fromItem = await prisma.inventoryItem.findUnique({
    where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
  });
  if (!fromItem || fromItem.availableQty < quantity) throw createError('Insufficient stock', 400);

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
      data: { quantity: { decrement: quantity }, availableQty: { decrement: quantity } },
    }),
    prisma.inventoryItem.upsert({
      where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
      create: { productId, warehouseId: toWarehouseId, quantity, availableQty: quantity },
      update: { quantity: { increment: quantity }, availableQty: { increment: quantity } },
    }),
    prisma.stockMovement.create({
      data: { productId, type: 'TRANSFER', quantity, fromWarehouseId, toWarehouseId, notes, userId },
    }),
  ]);

  res.json({ success: true, message: 'Stock transferred' });
});

// ===== SUPPLIERS ROUTER =====
export const suppliersRouter = Router();
suppliersRouter.use(authenticate);

suppliersRouter.get('/', async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true, orders: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: suppliers });
});

suppliersRouter.post('/', isAdminOrManager, async (req, res) => {
  const supplier = await prisma.supplier.create({ data: req.body });
  res.status(201).json({ success: true, data: supplier });
});

suppliersRouter.put('/:id', isAdminOrManager, async (req, res) => {
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: supplier });
});

suppliersRouter.delete('/:id', isAdminOrManager, async (req, res) => {
  await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true });
});

// ===== CUSTOMERS ROUTER =====
export const customersRouter = Router();
customersRouter.use(authenticate);

customersRouter.get('/', async (req, res) => {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: customers });
});

customersRouter.post('/', async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json({ success: true, data: customer });
});

customersRouter.put('/:id', async (req, res) => {
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: customer });
});

// ===== ORDERS ROUTER =====
export const ordersRouter = Router();
ordersRouter.use(authenticate);

ordersRouter.get('/', async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query;
  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      supplier: { select: { name: true } },
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
  const total = await prisma.order.count({ where });
  res.json({ success: true, data: orders, pagination: { total, page: Number(page), limit: Number(limit) } });
});

ordersRouter.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true } },
      supplier: true,
      customer: true,
      items: { include: { product: true } },
    },
  });
  if (!order) throw createError('Order not found', 404);
  res.json({ success: true, data: order });
});

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

ordersRouter.post('/', async (req, res) => {
  const { type, supplierId, customerId, items, notes, dueDate, discount = 0 } = req.body;
  const userId = (req as any).userId;

  let subtotal = 0;
  let taxAmount = 0;

  const orderItems = items.map((item: any) => {
    const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
    const itemTax = itemTotal * (item.taxRate || 0) / 100;
    subtotal += itemTotal;
    taxAmount += itemTax;
    return { ...item, total: itemTotal + itemTax };
  });

  const total = subtotal + taxAmount - discount;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      type,
      userId,
      supplierId,
      customerId,
      subtotal,
      taxAmount,
      discount,
      total,
      notes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } }, supplier: true, customer: true },
  });

  await logActivity(userId, 'CREATE_ORDER', 'ORDER', order.id, undefined, { orderNumber: order.orderNumber, total });
  res.status(201).json({ success: true, data: order });
});

ordersRouter.put('/:id/status', isAdminOrManager, async (req, res) => {
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}) },
  });
  res.json({ success: true, data: order });
});

// ===== NOTIFICATIONS ROUTER =====
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', async (req, res) => {
  const userId = (req as any).userId;
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
});

notificationsRouter.put('/read-all', async (req, res) => {
  const userId = (req as any).userId;
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});

notificationsRouter.put('/:id/read', async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json({ success: true });
});

// ===== REPORTS ROUTER =====
export const reportsRouter = Router();
reportsRouter.use(authenticate);

reportsRouter.get('/sales', async (req, res) => {
  const { from, to } = req.query;
  const orders = await prisma.order.findMany({
    where: {
      type: 'SALES',
      status: { not: 'CANCELLED' },
      createdAt: {
        gte: from ? new Date(String(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lte: to ? new Date(String(to)) : new Date(),
      },
    },
    include: { items: { include: { product: true } }, customer: true },
  });
  res.json({ success: true, data: orders });
});

reportsRouter.get('/inventory', async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    include: { product: { include: { category: true } }, warehouse: true },
  });
  res.json({ success: true, data: items });
});

// ===== ACTIVITIES ROUTER =====
export const activitiesRouter = Router();
activitiesRouter.use(authenticate);

activitiesRouter.get('/', isAdmin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = await prisma.activityLog.findMany({
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true, role: true } } },
  });
  const total = await prisma.activityLog.count();
  res.json({ success: true, data: logs, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// ===== UPLOAD ROUTER =====
export const uploadRouter = Router();
uploadRouter.use(authenticate);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

uploadRouter.post('/image', upload.single('image'), async (req, res) => {
  if (!req.file) throw createError('No file uploaded', 400);
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url, filename: req.file.filename } });
});
