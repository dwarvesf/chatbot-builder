import { ITrackable } from './base';
import { LogTable } from './log';

export interface NotificationTable extends ITrackable {
  id: BigInt;
  type_id?: NotificationTypeEnum;
  log_id?: BigInt;
  tow_id?: BigInt;
  title?: string;
  body?: string;
  metadata?: Record<any, any>;

  // Foreign key
  log?: LogTable;
}

export enum NotificationTypeEnum {
  TowCreated = 1,
  TowAccepted = 3,
  TowDeclined = 4,
  TowOnSite = 5,
  TowInTow = 6,
  TowCompleted = 7,
  WatchYourTime = 8,
  DriverUnassigned = 9,
  DriverAssigned = 10,
  DriverStatusChanged = 11,
  DriverChangedTruck = 12,
}
