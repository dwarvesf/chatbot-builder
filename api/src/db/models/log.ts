import { AddressBook } from './address_book';
import { Company } from './company';
import { TowStatusEnum } from './tow';
import { User, UserStatusEnum } from './user';

export interface LogTable {
  id: BigInt;
  type_id: LogTypeEnum;
  user_id?: BigInt;
  device_id?: BigInt;
  truck_id?: BigInt;
  tow_id?: BigInt;
  metadata?: LogMetadata;
  created_at: Date;
  created_by: BigInt;
}

export interface LogMetadata {
  // Company
  old_company?: Company;
  new_company?: Company;

  // Address Book
  old_address_book?: AddressBook;
  new_address_book?: AddressBook;

  // For status change
  old_user_status_id?: UserStatusEnum;
  new_user_status_id?: UserStatusEnum;

  // Driver
  old_driver_id?: BigInt;
  new_driver_id?: BigInt;
  old_allocation_id?: BigInt;
  new_allocation_id?: BigInt;

  // Tows
  old_tow_status_id?: TowStatusEnum;
  new_tow_status_id?: TowStatusEnum;
  tow_vehicle_id?: BigInt;

  attachment_ids?: BigInt[];

  old_user?: User;
  new_user?: User;
}

export enum LogTypeEnum {
  UserRegistered = 1,
  UserActivated = 2,
  UserAdded = 3,
  UserPwdChanged = 4,
  UserActivationEmailResent = 5,

  TruckAdded = 6,
  TruckUpdated = 7,
  TruckDeleted = 8,
  DeviceAdded = 9,

  DeviceActivated = 10,
  DeviceUpdated = 11,
  DeviceDeleted = 12,
  TruckAllocated = 13,
  TruckReturned = 14,
  UserStatusChanged = 15,

  CompanyUpdated = 16,

  DriverInfoChanged = 17,
  TowCreated = 18,
  TruckAllocationChanged = 19,
  TowStatusUpdated = 20,

  UserStatusChangedOutOfShift = 21,
  UserStatusChangedOnShift = 22,
  UserStatusChangedOnBreak = 23,
  TowUpdated = 24,
  TowDriverAssigned = 25,
  TowDriverUnassigned = 26,
  TowVehiclePhotoUploaded = 27,
  UserUpdated = 28,
  AdminResetUserPassword = 29,
  AdminForcedDriverStatus = 30,

  AddressBookCreated = 31,
  AddressBookDeleted = 32,
  AddressBookUpdated = 33,
}
