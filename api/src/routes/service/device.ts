import { Knex } from 'knex';
import db, { geomFromLongLat, st } from '../../db/db';
import { Device } from '../../db/models/device';
import { generateID } from './snowflake';

export interface INewDevice extends Omit<Device, 'id' | 'created_at'> {}
export async function addDevice({ d, repo = db }: { d: INewDevice; repo?: Knex }) {
  const devices = await repo<Device>('devices')
    .insert({
      ...d,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('*');

  if (!devices || devices.length === 0) {
    return null;
  }

  return devices[0];
}

export async function updateDevice({ d, repo = db }: { d: Partial<Device>; repo?: Knex }) {
  return repo<Device>('devices')
    .update({
      ...d,
      updated_at: new Date(),
    })
    .where({ id: d.id })
    .returning('*');
}

export async function getDevice({
  id,
  user_id,
  sign_up_code,
  notActivated = false,
  repo = db,
}: {
  id?: BigInt;
  user_id?: BigInt;
  sign_up_code?: number;
  notActivated?: boolean;
  repo?: Knex;
}): Promise<Device> {
  const query = repo<Device>('devices').whereNull('deleted_at');

  id && query.where('id', '=', id);
  user_id && query.where('user_id', '=', user_id);
  sign_up_code && query.where('sign_up_code', '=', sign_up_code);
  if (notActivated) {
    query.whereNull('activated_at');
  }

  const d = await query.select('*', st.asGeoJSON('last_location')).first();
  return d;
}

export async function getDevices({
  user_id,
  user_ids,
  company_id,
  activatedOnly,
  repo = db,
}: {
  user_id?: BigInt;
  user_ids?: BigInt[];
  company_id?: number;
  activatedOnly?: boolean;
  repo?: Knex;
}): Promise<Device[]> {
  const query = repo<Device>('devices').whereNull('deleted_at');

  user_id && query.where('user_id', '=', user_id);
  user_ids && query.whereIn('user_id', user_ids);
  activatedOnly && query.whereNotNull('activated_at');
  if (company_id) {
    query.join('users', 'devices.user_id', '=', 'users.id').where('users.company_id', '=', company_id);
  }

  const devices = await query.select('devices.*', st.asGeoJSON('last_location'));
  return devices;
}

export async function updateDeviceLocation(
  id: BigInt,
  { lat, long, updated_by }: { lat: number; long: number; updated_by: BigInt },
  repo = db
) {
  return repo<Device>('devices')
    .where({ id })
    .update({
      last_location: geomFromLongLat(long, lat),
      updated_by,
      updated_at: new Date(),
    });
}
