import cron from 'node-cron';
import { prisma } from '../config/database';
import { sendLowStockAlert } from '../utils/email';

export const setupCronJobs = () => {
  // Check low stock every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking low stock...');
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { inventoryItems: true },
      });

      const lowStock = products
        .map(p => ({
          ...p,
          stock: p.inventoryItems.reduce((s, i) => s + i.quantity, 0),
        }))
        .filter(p => p.stock <= p.reorderPoint && p.stock > 0);

      if (lowStock.length > 0) {
        await prisma.notification.createMany({
          data: lowStock.map(p => ({
            type: 'LOW_STOCK' as const,
            title: `Low Stock: ${p.name}`,
            message: `${p.name} (${p.sku}) has only ${p.stock} units left. Reorder point: ${p.reorderPoint}`,
            data: { productId: p.id, stock: p.stock, reorderPoint: p.reorderPoint },
          })),
          skipDuplicates: false,
        });

        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
          select: { email: true },
        });

        for (const admin of admins) {
          await sendLowStockAlert(admin.email, lowStock.map(p => ({
            name: p.name, sku: p.sku, stock: p.stock, reorderPoint: p.reorderPoint,
          })));
        }
      }
    } catch (err) {
      console.error('[CRON] Low stock check failed:', err);
    }
  });

  // Check expiry alerts daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Checking expiry dates...');
    try {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const expiring = await prisma.batchLot.findMany({
        where: {
          expiryDate: { lte: sevenDaysFromNow, gte: new Date() },
          quantity: { gt: 0 },
        },
        include: { product: true },
      });

      if (expiring.length > 0) {
        await prisma.notification.createMany({
          data: expiring.map(batch => ({
            type: 'EXPIRY_ALERT' as const,
            title: `Expiry Alert: ${batch.product.name}`,
            message: `Batch ${batch.batchNumber} of ${batch.product.name} expires on ${batch.expiryDate?.toLocaleDateString()}`,
            data: { productId: batch.productId, batchId: batch.id, expiryDate: batch.expiryDate },
          })),
        });
      }
    } catch (err) {
      console.error('[CRON] Expiry check failed:', err);
    }
  });

  // Cleanup old notifications (older than 90 days)
  cron.schedule('0 0 * * 0', async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff }, isRead: true } });
    console.log('[CRON] Old notifications cleaned up');
  });

  console.log('[CRON] Jobs scheduled');
};
