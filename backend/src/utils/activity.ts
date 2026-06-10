import { prisma } from '../config/database';

export const logActivity = async (
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
