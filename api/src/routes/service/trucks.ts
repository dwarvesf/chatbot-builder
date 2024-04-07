import db from '../../db/db.ts';
import { Pagination } from '../../db/models/paging.ts';
import { Truck } from '../../db/models/truck.ts';
import { generateID } from './snowflake.ts';

export async function getTruck(
  {
    companyID,
    id,
    license_plate,
    excludedIDs,
    state_id,
    active,
  }: {
    companyID?: number;
    id?: BigInt;
    excludedIDs?: BigInt[];
    license_plate?: string;
    state_id?: number;
    active?: boolean;
  },
  repo = db
) {
  const query = repo<Truck>('trucks').whereNull('deleted_at');

  if (id) query.where({ id });
  if (companyID) query.where({ company_id: companyID });
  if (license_plate) query.where({ license_plate });
  if (excludedIDs && excludedIDs.length > 0) query.whereNotIn('id', excludedIDs);
  if (state_id) query.where('state_id', '=', state_id);
  if (active) query.where('active', '=', active);
  const aTruck = query.first();
  return aTruck;
}

export async function getTrucks(
  {
    companyID,
    searchText,
    license_plate,
    active,
    truck_type_ids,
    offset = 0,
    limit = 100,
    stateId,
  }: {
    companyID: number;
    searchText?: string;
    license_plate?: string;
    active?: boolean;
    truck_type_ids?: number[];
    offset: number;
    limit: number;
    stateId?: number;
  },
  repo = db
) {
  const query = repo<Truck>('trucks').where({ company_id: companyID }).whereNull('deleted_at');

  if (truck_type_ids && truck_type_ids.length > 0) {
    query.where('tt.id', 'in', truck_type_ids);
  }

  if (searchText) {
    query.join('truck_types as tt', 'tt.id', 'trucks.truck_type_id');
    query.join('states as s', 's.id', 'trucks.state_id');

    query.where((qb) => {
      qb.where('tt.name', 'ilike', `%${searchText}%`)
        .orWhere('s.name', 'ilike', `%${searchText}%`)
        .orWhere('license_plate', 'ilike', `%${searchText}%`);
    });
  }

  if (license_plate) query.where('license_plate', '=', license_plate).whereNull('deleted_at');
  if (active !== null) query.where('active', '=', active).whereNull('deleted_at');
  if (truck_type_ids) query.where('truck_type_id', '=', truck_type_ids).whereNull('deleted_at');
  if (stateId) {
    query.where('state_id', '=', stateId);
  }
  const countRows = await query.clone().count();
  const trucks = await query.offset(offset).limit(limit).orderBy('trucks.created_at').select('*');

  const count = Number(countRows[0].count);
  const paging: Pagination = {
    offset,
    limit,
    total: count,
  };

  return {
    trucks,
    paging,
  };
}

type INewTruck = Omit<
  Truck,
  'id' | 'created_at' | 'updated_by' | 'deleted_by' | 'updated_at' | 'deleted_at' | 'last_allocation_id'
>;
export async function addNewTruck({ companyID, t }: { companyID: number; t: INewTruck }, repo = db) {
  const query = repo<Truck>('trucks').where({ company_id: companyID });
  const addTruck = await query
    .insert({
      ...t,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('*');

  return addTruck[0];
}

export async function updateTruck(
  {
    companyID,
    id,
    t,
  }: {
    companyID: number;
    t: Partial<Truck>;
    id: BigInt;
  },
  repo = db
) {
  const query = repo<Truck>('trucks').where({ company_id: companyID }).whereNull('deleted_at');

  await query.andWhere({ id }).update({
    ...t,
    updated_at: new Date(),
  });
}

export async function deleteTruck(
  {
    companyID,
    id,
    t,
  }: {
    companyID: number;
    id: BigInt;
    t: Partial<Truck>;
  },
  repo = db
) {
  const query = repo<Truck>('trucks').where({ company_id: companyID });
  await query.andWhere({ id }).update({
    ...t,
    deleted_at: new Date(),
  });
}
