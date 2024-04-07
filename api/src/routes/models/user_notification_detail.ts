import { NotificationTable } from '../../db/models/notification';

export interface UserNotificationDetail {
  id: BigInt;
  user_id: BigInt;
  notification_id: BigInt;
  read_at?: Date;

  notification?: NotificationTable;
}
