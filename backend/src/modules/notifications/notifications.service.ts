import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export interface FormattedNotification {
  id: string;
  eventType: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedPath?: string;
  relatedId?: string;
  createdAt: string;
}

export function formatNotification(n: {
  id: string;
  eventType: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedPath?: string | null;
  relatedId?: string | null;
  createdAt: Date | string;
}): FormattedNotification {
  return {
    id: n.id,
    eventType: n.eventType,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    relatedPath: n.relatedPath ?? undefined,
    relatedId: n.relatedId ?? undefined,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
  };
}

export async function getNotifications(organizationId: string): Promise<FormattedNotification[]> {
  const list = await prisma.notification.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return list.map(formatNotification);
}

export async function markNotificationAsRead(
  id: string,
  organizationId: string
): Promise<FormattedNotification> {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  if (notification.organizationId !== organizationId) {
    throw new AppError(
      'Forbidden: You do not have permission to modify this notification',
      403,
      'FORBIDDEN'
    );
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return formatNotification(updated);
}

export async function markAllNotificationsAsRead(
  organizationId: string
): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      organizationId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return { count: result.count };
}

export interface CreateNotificationInput {
  organizationId: string;
  title: string;
  body: string;
  eventType: string;
  relatedPath?: string;
  relatedId?: string;
}

export async function createNotification(
  client: any,
  data: CreateNotificationInput
) {
  const db = client.notification ? client : prisma;
  return db.notification.create({
    data: {
      organizationId: data.organizationId,
      title: data.title,
      body: data.body,
      eventType: data.eventType,
      relatedPath: data.relatedPath,
      relatedId: data.relatedId,
    },
  });
}
