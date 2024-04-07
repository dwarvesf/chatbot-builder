import { ISoftDelete, ITrackable } from './base';

export interface Device extends ITrackable, ISoftDelete {
  id: BigInt;
  phone: string;
  device_uuid?: string;
  user_id: BigInt;
  type_id: DeviceTypeEnum;
  status_id: DeviceStatusEnum;
  sign_up_code: number;
  activated_at?: Date;
  last_active_at?: Date;
  last_location?: any;
  fcm_token?: string;
}

export enum DeviceTypeEnum {
  Android = 1,
  IOS = 2,
}

export enum DeviceStatusEnum {
  ActivationPending = 1,
  Activated = 2,
}
