import { ITrackable } from './base';

export interface User extends ITrackable {
  id: BigInt;
  user_number?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  pwd_change_required?: boolean;
  hashed_password?: string;
  activated_at?: Date;
  permit?: string;
  status_id?: UserStatusEnum;
  active?: Boolean;
  fcm_token?: string;
  last_active_at?: Date;
  current_tow_id?: BigInt;
  last_truck_allocation_id?: BigInt;
}

export interface UserRole {
  user_id: BigInt;
  role_id: number;
}

export interface UserPermission {
  id: number;
  user_id: BigInt;
  permission_id: number;
}

export enum UserStatusEnum {
  DRIVER_OUT_OF_SHIFT = 1,
  DRIVER_ON_SHIFT = 2,
  DRIVER_ON_BREAK = 3,
  DRIVER_HANDLING_TOW = 4,
  DRIVER_FORCED_BREAK = 5,
  DRIVER_FORCED_LOGOUT = 6,
}
