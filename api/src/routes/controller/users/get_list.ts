import { IsIn, IsNumberString, ValidateIf } from 'class-validator';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TruckTypeEnum } from '../../../db/models/truck';
import { User, UserStatusEnum } from '../../../db/models/user';
import { getUserRoles, getUsers } from '../../service/users';
import { getRqUser } from '../../utils/request';
import { getRqPaging } from '../utils';
import { notNullOrEmpty, validateObj } from '../validator';

class getUsersRequestValidatorClz {
  search_text?: string;

  @ValidateIf(notNullOrEmpty)
  @IsNumberString({ no_symbols: true }, { each: true })
  user_ids?: string[];

  @ValidateIf(notNullOrEmpty)
  @IsNumberString({ no_symbols: true }, { each: true })
  role_ids?: string[];

  @ValidateIf(notNullOrEmpty)
  @IsNumberString({ no_symbols: true }, { each: true })
  @IsIn(['1', '2', '3', '4', '5', '6'], { each: true }) // UserStatusEnum
  status_ids?: string[];

  @ValidateIf(notNullOrEmpty)
  @IsNumberString({ no_symbols: true }, { each: true })
  @IsIn(['1', '2', '3', '4', '5'], { each: true }) // TruckTypeEnum
  truck_type_ids?: string[];
}

export async function getUsersHandler(req: Request, res: Response) {
  const u = getRqUser(req);
  const companyID = u.company_id;

  const errMsg = await validateObj(getUsersRequestValidatorClz, req.query);
  if (errMsg) {
    res.status(StatusCodes.BAD_REQUEST).send(errMsg);
    return;
  }

  const searchText = req.query.search_text as string;
  let roleIds: number[] = [];
  if (req.query.role_ids) {
    roleIds = (req.query.role_ids as string[]).map((id) => Number(id));
  }

  let userIds: BigInt[] = [];
  if (req.query.user_ids) {
    userIds = (req.query.user_ids as string[]).map((id) => BigInt(id));
  }

  let statusIDs: UserStatusEnum[] = [];
  if (req.query.status_ids) {
    statusIDs = (req.query.status_ids as string[]).map((id) => Number(id));
  }

  let truckTypeIDs: TruckTypeEnum[] = [];
  if (req.query.truck_type_ids) {
    truckTypeIDs = (req.query.truck_type_ids as string[]).map((id) => Number(id));
  }

  const { offset = 0, limit = 10 } = getRqPaging(req);

  const { users, paging } = await getUsers({
    companyID,
    searchText,
    userIds,
    roleIds,
    statusIDs,
    truckTypeIDs,
    offset,
    limit,
  });

  // To models and json response
  const items = users.map((user) => toUserItem(user));

  const loadUserRoles = req.query.load_user_roles === 'true';
  if (loadUserRoles) {
    const userRoles = await getUserRoles({ userIDs: users.map((u) => u.id) });
    items.forEach((item) => {
      item.roles = userRoles.filter((ur) => ur.user_id === BigInt(item.id)).map((ur) => ur.role_id);
    });
  }

  res.json({
    items,
    paging,
  });
}

function toUserItem(user: User): userItem {
  const { hashed_password, ...rest } = user;

  const u: userItem = {
    ...rest,
    id: user.id.toString(),
    created_by: user.created_by?.toString(),
  };

  return u;
}

interface userItem {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  company_id?: number;
  email: string;
  phone?: string;
  pwd_change_required?: boolean;
  activated_at?: Date;
  roles?: number[];

  created_at: Date;
  created_by?: string;
  updated_at?: Date;
}
