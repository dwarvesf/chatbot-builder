import { Knex } from 'knex';
import { uniq } from 'lodash';
import db from '../../db/db';
import { Pagination } from '../../db/models/paging';
import { RoleEnum } from '../../db/models/role';
import { RolePermission } from '../../db/models/role_permission';
import { TruckTypeEnum } from '../../db/models/truck';
import { User, UserPermission, UserRole, UserStatusEnum } from '../../db/models/user';
import { UserDetail } from '../models/user';
import { generateID } from './snowflake';

export async function getUserDetail({
  id,
  username,
  email,
  repo = db,
}: {
  id?: BigInt;
  username?: string;
  email?: string;
  repo?: Knex;
}): Promise<UserDetail> {
  const query = repo<User>('users');

  id && query.where('id', '=', id.toString());
  username && query.where('username', '=', username);
  email && query.where('email', '=', email);

  const user: User = await query.first();
  if (!user) {
    return null;
  }

  const u: UserDetail = {
    ...user,
    id: user.id.toString(),
  };
  u.permissions = (
    await repo<UserPermission>('user_permissions').where('user_id', '=', user.id).select('permission_id')
  ).map((up) => up.permission_id);

  u.roles = (await repo<UserRole>('user_roles').where('user_id', '=', user.id).select('role_id')).map(
    (ur) => ur.role_id
  );

  const rolePermissionIDs = (
    await repo<RolePermission>('role_permissions').whereIn('role_id', u.roles).select('permission_id')
  ).map((rp) => rp.permission_id);
  u.permissions = uniq([...u.permissions, ...rolePermissionIDs]);

  return u;
}

interface INewUser extends Omit<User, 'id' | 'created_at'> {}
export async function addUser({ u, repo = db }: { u: INewUser; repo?: Knex }) {
  const user: User = {
    ...u,
    id: generateID(),
    created_at: new Date(),
  };
  const rows = await repo<User>('users').insert(user).returning('*');
  if (!rows || rows.length === 0) {
    return null;
  }
  return rows[0];
}

export async function addUserRole({ userID, roleID }: { userID: BigInt; roleID: number }, repo = db) {
  await repo<UserRole>('user_roles').insert({
    user_id: userID,
    role_id: roleID,
  });
}

export async function deleteUserRole({ userID, roleID }: { userID?: BigInt; roleID?: number }, repo = db) {
  const qm = repo<UserRole>('user_roles');
  userID && qm.where({ user_id: userID });
  roleID && qm.where({ role_id: roleID });
  await qm.del();
}

export async function isUserNameExists(email: string, repo = db) {
  const user = await repo<User>('users').where({ email }).select('id').first();
  return !!user;
}

export async function updateUser(u: Partial<User>, repo = db) {
  await repo<User>('users')
    .where({ id: u.id })
    .update({
      ...u,
      updated_at: new Date(),
    });
}

export async function getUser(
  {
    id,
    email,
    companyID,
    roleIDs,
  }: {
    id?: BigInt;
    email?: string;
    companyID?: number;
    roleIDs?: number[];
  },
  repo = db
) {
  const query = repo<User>('users AS u').select('u.*');

  id && query.where('u.id', '=', id.toString());
  email && query.where('u.email', '=', email);
  companyID && query.where('u.company_id', '=', companyID.toString());
  if (roleIDs && roleIDs.length > 0) {
    query.join('user_roles AS ur', 'u.id', '=', 'ur.user_id').whereIn('ur.role_id', roleIDs);
  }

  const user: User = await query.first();
  if (!user) {
    return null;
  }
  return user;
}

export async function getUsers(
  {
    ids,
    companyID,
    userIds = [],
    roleIds = [],
    statusIDs = [],
    truckTypeIDs = [],
    searchText,
    offset = 0,
    limit = 100,
  }: {
    ids?: BigInt[];
    companyID?: number;
    userIds?: BigInt[];
    roleIds?: RoleEnum[];
    statusIDs?: UserStatusEnum[];
    truckTypeIDs?: TruckTypeEnum[];
    searchText?: string;
    offset?: number;
    limit?: number;
  },
  repo = db
): Promise<{
  users: User[];
  paging: Pagination;
}> {
  const query = repo<User>('users AS u');

  if (ids && ids.length > 0) {
    query.whereIn('u.id', ids);
  }
  if (companyID) {
    query.where('u.company_id', '=', companyID);
  }

  if (searchText) {
    query.where((qb) => {
      qb.whereILike('u.first_name', `%${searchText}%`)
        .orWhereILike('u.last_name', `%${searchText}%`)
        .orWhereILike('u.permit', `%${searchText}%`)
        .orWhereILike('u.email', `%${searchText}%`)
        .orWhereILike('u.phone', `%${searchText}%`);
    });
  }

  if (roleIds.length > 0) {
    query.join('user_roles AS ur', 'u.id', '=', 'ur.user_id').whereIn('ur.role_id', roleIds);
  }

  if (userIds.length > 0) {
    query.whereIn('u.id', userIds);
  }

  if (statusIDs.length > 0) {
    query.whereIn('u.status_id', statusIDs);
  }

  if (truckTypeIDs.length > 0) {
    query
      .join('truck_allocations AS ta', 'u.last_truck_allocation_id', '=', 'ta.id')
      .join('trucks AS t', 'ta.truck_id', '=', 't.id')
      .whereIn('t.truck_type_id', truckTypeIDs);
  }

  const countRows = await query.clone().count();
  const users = await query.offset(offset).limit(limit).orderBy('created_at').select('u.*');

  const count = Number(countRows[0].count);
  const paging: Pagination = {
    offset,
    limit,
    total: count,
  };
  return {
    users,
    paging,
  };
}

export interface UserStatRow {
  role_id: number;
  count: BigInt;
}
export async function getUsersRolesStats(companyID: number): Promise<UserStatRow[]> {
  const rows: UserStatRow[] = await db
    .where({ company_id: companyID })
    .from('users AS u')
    .join('user_roles AS ur', 'u.id', '=', 'ur.user_id')
    .groupBy('ur.role_id')
    .select('ur.role_id')
    .count('*');

  return rows;
}

export async function getUserRoleEnums(userID: BigInt, repo = db): Promise<RoleEnum[]> {
  const rows: UserRole[] = await repo('user_roles').where({ user_id: userID }).select('role_id');
  return rows.map((ur) => ur.role_id);
}

export async function getUserRoles(filters: { userIDs?: BigInt[] } = {}, repo = db): Promise<UserRole[]> {
  const qm = repo<UserRole>('user_roles');

  if (filters.userIDs && filters.userIDs.length > 0) {
    qm.whereIn('user_id', filters.userIDs);
  }

  return await qm;
}
