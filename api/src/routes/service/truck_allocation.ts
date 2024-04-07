import { Knex } from 'knex';
import db from '../../db/db';
import { TruckAllocation } from '../../db/models/truck_allocation';
import { generateID } from './snowflake';

type INewTruckAllocation = Omit<TruckAllocation, 'id' | 'created_at' | 'available'>;
export async function addNewTruckAllocation({ t, repo }: { t: INewTruckAllocation; repo?: Knex }) {
  const query = db<TruckAllocation>('truck_allocations');
  const addTruckAllocation = await query
    .insert({
      ...t,
      created_at: new Date(),
      id: generateID(),
    })
    .returning('*');

  return addTruckAllocation[0];
}

export async function getTruckAllocation({
  id,
  driver_id,
  truck_id,
  companyID,
  isToNull,
}: {
  id?: BigInt;
  driver_id?: BigInt;
  truck_id?: BigInt;
  companyID?: number;
  isToNull?: boolean;
}) {
  const query = db<TruckAllocation>('truck_allocations');

  if (id) query.where('truck_allocations.id', '=', id);
  if (driver_id) query.where('truck_allocations.driver_id', '=', driver_id);
  if (truck_id) query.where('truck_allocations.truck_id', '=', truck_id);
  if (companyID) {
    // Join with users table
    query.join('users', 'truck_allocations.driver_id', '=', 'users.id').where('users.company_id', '=', companyID);
  }
  if (isToNull) query.whereNull('truck_allocations.to');

  const aTruckAllocation = query.first();
  return aTruckAllocation;
}

export async function updateTruckAllocation({ t, repo }: { t: Partial<TruckAllocation>; repo?: Knex }) {
  const query = db<TruckAllocation>('truck_allocations').where('id', '=', t.id);
  await query.update({
    ...t,
    updated_at: new Date(),
  });
}
