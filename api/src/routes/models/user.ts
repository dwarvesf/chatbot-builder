import { PermissionEnum } from '../../db/models/permission';
import { RoleEnum } from '../../db/models/role';
import { UserStatusEnum } from '../../db/models/user';

export interface UserDetail {
  id: string;
  first_name: string;
  last_name: string;
  company_id?: number;
  email: string;
  hashed_password?: string;
  activated_at?: Date;
  status_id?: UserStatusEnum;
  pwd_change_required?: boolean;
  fcm_token?: string;

  // Relations
  roles?: RoleEnum[];
  permissions?: PermissionEnum[];
}
