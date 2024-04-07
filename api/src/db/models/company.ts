import { ITrackable } from './base';

export interface Company extends ITrackable {
  id: number;
  customer_id: number;
  name: string;
  description?: string;
  address?: string;
  address2?: string;
  city?: string;
  state_id?: number;
  zipcode?: string;
  phone_number?: string;
  fax?: string;
  dispatch?: string;
  customer_service?: string;
  ivr_pin?: string;
  primary_email?: string;
  motor_carrier_number?: string;
  business_license?: string;
  logo_attachment_id: BigInt;
}
