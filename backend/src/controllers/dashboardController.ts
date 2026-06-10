import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getDashboardStats = async (req: Request, res: Response) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    activeProducts,
    allInventory,
    recentOrders,
    lastMonthOrders,
    notifications,
    recentActivities,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { inventoryItems: true },
    }),
    prisma.inventoryItem.findMany({ include: { product: true } }),
    prisma.order.findMany({
      where: { type: 'SALES', createdAt: { gte: thirtyDaysAgo } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { type: 'SALES', createdAt: { gte: lastMonth, lt: thirtyDaysAgo } },
      include: { items: true },
    }),
    prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } },
    }),
  ]);

  // Stock calculations
  const productsWithStock = activeProducts.map(p => ({
    ...p,
    totalStock: p.inventoryItems.reduce((s, i) => s + i.quantity, 0),
  }));
  const lowStockProducts = productsWithStock.filter(
    p => p.totalStock > 0 && p.totalStock <= p.reorderPoint
  );
  const outOfStockProducts = productsWithStock.filter(p => p.totalStock === 0);
  const inventoryValue = productsWithStock.reduce(
    (sum, p) => sum + p.totalStock * p.costPrice, 0
  );
  const retailValue = productsWithStock.reduce(
    (sum, p) => sum + p.totalStock * p.sellingPrice, 0
  );

  // Revenue calculations
  const revenue = recentOrders.reduce((s, o) => s + o.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.total, 0);
  const revenueGrowth = lastMonthRevenue > 0
    ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 100;

  // Sales graph (last 30 days)
  const salesByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    salesByDay[d.toISOString().split('T')[0]] = 0;
  }
  recentOrders.forEach(o => {
    const day = o.createdAt.toISOString().split('T')[0];
    if (salesByDay[day] !== undefined) salesByDay[day] += o.total;
  });

  const salesGraph = Object.entries(salesByDay).map(([date, revenue]) => ({ date, revenue }));

  // Top products by sales
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  recentOrders.forEach(o =>
    o.items.forEach(i => {
      if (!productSales[i.productId]) productSales[i.productId] = { name: '', qty: 0, revenue: 0 };
      productSales[i.productId].qty += i.quantity;
      productSales[i.productId].revenue += i.total;
    })
  );

  res.json({
    success: true,
    data: {
      stats: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        inventoryValue,
        retailValue,
        potentialProfit: retailValue - inventoryValue,
        revenue: { current: revenue, previous: lastMonthRevenue, growth: revenueGrowth },
        orders: {
          total: recentOrders.length,
          pending: recentOrders.filter(o => o.status === 'PENDING').length,
        },
      },
      salesGraph,
      lowStockProducts: lowStockProducts.slice(0, 10),
      outOfStockProducts: outOfStockProducts.slice(0, 10),
      notifications,
      recentActivities,
    },
  });
};

export const getRevenueAnalytics = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  const days = period === '90d' ? 90 : period === '7d' ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: { type: 'SALES', status: { not: 'CANCELLED' }, createdAt: { gte: since } },
    include: { items: { include: { product: true } } },
  });

  const byDate: Record<string, { revenue: number; orders: number; profit: number }> = {};
  orders.forEach(o => {
    const date = o.createdAt.toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = { revenue: 0, orders: 0, profit: 0 };
    byDate[date].revenue += o.total;
    byDate[date].orders++;
    byDate[date].profit += o.items.reduce(
      (s, i) => s + (i.unitPrice - i.product.costPrice) * i.quantity, 0
    );
  });

  res.json({ success: true, data: { byDate, total: orders.length, revenue: orders.reduce((s, o) => s + o.total, 0) } });
};
