import db from '../../db/db';
import { LogTable } from '../../db/models/log';
import { NotificationTable, NotificationTypeEnum } from '../../db/models/notification';
import { Pagination } from '../../db/models/paging';
import { UserNotificationTable } from '../../db/models/user_notification';
import { UserNotificationDetail } from '../models/user_notification_detail';
import { generateID } from './snowflake';

export async function createNotification(n: Partial<NotificationTable>, repo = db) {
  const notification = await repo<NotificationTable>('notifications')
    .insert({
      ...n,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('id');

  const id = notification.map((n) => n.id)[0];
  return id;
}

export async function createUserNotification(un: Partial<UserNotificationTable>, repo = db) {
  const userNotification = await repo<UserNotificationTable>('user_notifications')
    .insert({
      ...un,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('id');
  const id = userNotification.map((un) => un.id)[0];

  return id;
}

export async function getNotification(
  {
    id,
    towId,
    typeId,
    createdAtFrom,
  }: { id?: BigInt; towId?: BigInt; typeId?: NotificationTypeEnum; createdAtFrom?: Date },
  repo = db
) {
  const query = repo<NotificationTable>('notifications');
  if (id) {
    query.where({ id });
  }
  if (towId) {
    query.where({ tow_id: towId });
  }
  if (typeId) {
    query.where({ type_id: typeId });
  }
  if (createdAtFrom) {
    query.where('created_at', '>=', createdAtFrom);
  }

  const n = await query.first();
  return n;
}

export async function getUserNotification({ id, userID }: { id?: BigInt; userID?: BigInt }, repo = db) {
  const query = repo<UserNotificationTable>('user_notifications');

  if (id) {
    query.where({ id });
  }
  if (userID) {
    query.where({ user_id: userID });
  }

  const un = await query.first();
  return un;
}

export async function getUnreadCount({ userID, from, to }: { userID: BigInt; from?: Date; to?: Date }) {
  const query = db<UserNotificationTable>('user_notifications')
    .where({ user_id: userID })
    .whereNull('read_at')
    .count('id');

  if (from) {
    query.where('created_at', '>=', from);
  }
  if (to) {
    query.where('created_at', '<=', to);
  }

  const count = await query;
  return Number(count[0].count);
}

export async function getUserNotificationDetails(
  {
    userID,
    offset,
    limit = 100,
    readOnly,
    unreadOnly,
    from,
    to,
  }: {
    offset?: number;
    limit?: number;
    readOnly?: boolean;
    unreadOnly?: boolean;
    userID?: BigInt;
    from?: Date;
    to?: Date;
  },
  repo = db
): Promise<{ notifications: UserNotificationDetail[]; paging: Pagination }> {
  const query = repo<UserNotificationTable>('user_notifications');

  if (userID) {
    query.where({ user_id: userID });
  }

  if (readOnly) {
    query.whereNotNull('read_at');
  }

  if (unreadOnly) {
    query.whereNull('read_at');
  }

  if (from) {
    query.where('created_at', '>=', from);
  }

  if (to) {
    query.where('created_at', '<=', to);
  }

  const countRows = await query.clone().count('id');
  const total = Number(countRows[0].count);

  const userNotifications: UserNotificationDetail[] = await query
    .select('*')
    .limit(limit)
    .offset(offset)
    .orderBy('created_at', 'desc');

  // Load notifications
  const notificationIDs = userNotifications.map((n) => n.notification_id);
  const notiArr = await repo<NotificationTable>('notifications').whereIn('id', notificationIDs);
  // Load notification to user notification
  notiArr.forEach((n) => {
    const un = userNotifications.find((un) => un.notification_id === n.id);
    if (un) {
      un.notification = n;
    }
  });

  // Load logs
  // One logs could be used in multiple notifications
  const logIDs = notiArr.map((n) => n.log_id);
  const logs = await repo<LogTable>('logs').whereIn('id', logIDs);
  // Load log to notification
  logs.forEach((l) => {
    const n = notiArr.find((n) => n.log_id === l.id);
    if (n) {
      n.log = l;
    }
  });

  return { notifications: userNotifications, paging: { offset, limit, total } };
}

export async function updateUserNotifications(
  { ids, userID, unreadOnly }: { ids?: BigInt[]; userID?: BigInt; unreadOnly?: boolean },
  u: Partial<UserNotificationTable>,
  repo = db
) {
  const q = repo<UserNotificationTable>('user_notifications');

  if (ids && ids.length > 0) {
    q.whereIn('id', ids);
  }
  if (userID) {
    q.where({ user_id: userID });
  }
  if (unreadOnly) {
    q.whereNull('read_at');
  }

  const updated = await q.update({
    ...u,
    updated_at: new Date(),
  });
  return updated;
}
