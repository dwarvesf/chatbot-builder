import db, { geomFromLongLat, st } from '../../db/db';
import { Pagination } from '../../db/models/paging';
import { TowStatusEnum, TowTable } from '../../db/models/tow';
import { TowVehicleTable } from '../../db/models/tow_vehicle';
import { TowVehicleReasonMap } from '../../db/models/tow_vehicle_reason_map';
import { User } from '../../db/models/user';
import { Tow, towModelFromTable } from '../models/tow';
import { generateID } from './snowflake';

export async function createTow(t: Tow, repo = db) {
  // Create tow
  const towID = generateID();
  const tow = {
    ...t,
    id: towID,
    location_geo: geomFromLongLat(t.location_geo.long, t.location_geo.lat),
    requested_time: new Date(t.requested_time),
    destination_geo: geomFromLongLat(t.destination_geo.long, t.destination_geo.lat),
    created_at: new Date(),
  };
  delete tow.vehicles; // Not a field in the table

  await repo<TowTable>('tows').insert(tow);
  return towID;
}

export async function getTow(
  { id, companyID, driverID }: { id?: BigInt; companyID?: number; driverID?: BigInt },
  repo = db
) {
  const query = repo<TowTable>('tows as t').select(
    't.*',
    st.asGeoJSON('t.location_geo').as('location_geo'),
    st.asGeoJSON('t.destination_geo').as('destination_geo')
  );

  if (id) {
    query.where('t.id', '=', id);
  }

  if (driverID) {
    query.where('t.driver_id', '=', driverID);
  }

  if (companyID) {
    query.join('users as u', 'u.id', 't.created_by');
    query.where('u.company_id', '=', companyID);
  }

  const tow = await query.first();
  return towModelFromTable(tow);
}

export async function getTows(
  {
    expectedResponseFrom,
    expectedResponseTo,
    statusIDs,
    limit = 100,
    offset = 0,
  }: {
    expectedResponseFrom?: Date;
    expectedResponseTo?: Date;
    statusIDs?: TowStatusEnum[];
    limit?: number;
    offset?: number;
  },
  repo = db
) {
  const query = repo<TowTable>('tows');

  if (statusIDs && statusIDs.length > 0) {
    query.andWhere('status_id', 'in', statusIDs);
  }

  if (expectedResponseFrom) {
    query.andWhere('expected_response_at', '>=', expectedResponseFrom);
  }
  if (expectedResponseTo) {
    query.andWhere('expected_response_at', '<=', expectedResponseTo);
  }

  const totalRow = await query.clone().count('id', { as: 'total' }).first();

  const tows = await query.select('*').limit(limit).offset(offset);
  return {
    tows,
    pagination: {
      limit,
      offset,
      total: parseInt(totalRow.total.toString()),
    } as Pagination,
  };
}

export async function updateTow(id: BigInt, t: Partial<TowTable>, repo = db) {
  await repo<TowTable>('tows')
    .where({ id })
    .update({
      ...t,
      updated_at: new Date(),
    });
}

export async function getTowsWithPaging(args: {
  statusIDs?: TowStatusEnum[];
  requestedFrom?: Date;
  requestedTo?: Date;
  equipmentIDs?: number[];
  colorIDs?: number[];
  model?: string;
  year?: number;
  driverID?: BigInt;
  company_id?: number;

  searchText?: string;

  loadDriver?: boolean;
  loadTowVehicles?: boolean;
  loadTowVehicleReasons?: boolean;

  pagination?: Pagination;
  orderBy?: string;
  orderAsc?: boolean;
}): Promise<{ tows: Tow[]; paging: Pagination }> {
  const query = db<TowTable>('tows as t');

  // Query options
  if (args.statusIDs && args.statusIDs.length > 0) {
    query.andWhere('t.status_id', 'in', args.statusIDs);
  }
  if (args.requestedFrom) {
    query.andWhere('t.requested_time', '>=', args.requestedFrom);
  }
  if (args.requestedTo) {
    query.andWhere('t.requested_time', '<=', args.requestedTo);
  }
  if (args.equipmentIDs && args.equipmentIDs.length > 0) {
    query.andWhere('t.equipment_id', 'in', args.equipmentIDs);
  }

  if (args.driverID) {
    query.andWhere('t.driver_id', '=', args.driverID);
  }

  // Join created_by
  query.join('users as u', 't.created_by', 'u.id');
  if (args.company_id) {
    query.andWhere('u.company_id', '=', args.company_id);
  }

  // Join vehicle if needed
  if (args.searchText || args.model || args.year || args.colorIDs) {
    query.join('tow_vehicles as tv', 't.id', 'tv.tow_id');
  }

  // Query on join tables
  if (args.colorIDs && args.colorIDs.length > 0) {
    query.andWhere('tv.color_id', 'in', args.colorIDs);
  }
  if (args.model) {
    query.andWhere('tv.model', 'ilike', `%${args.model}%`);
  }
  if (args.year) {
    query.andWhere('tv.year', '=', args.year);
  }

  // Search text
  if (args.searchText) {
    query.orWhere('t.requestor_name', 'ilike', `%${args.searchText}%`);
    query.orWhere('t.location_name', 'ilike', `%${args.searchText}%`);
    query.orWhere('t.destination_name', 'ilike', `%${args.searchText}%`);

    query.orWhere('tv.license', 'ilike', `%${args.searchText}%`);
  }

  // Paging
  const totalRow = await query.clone().countDistinct('t.id', { as: 'total' }).first();
  const paging = args.pagination || { limit: 100, offset: 0 }; // Default limit 100, offset 0
  query
    .limit(paging.limit)
    .offset(paging.offset)
    .orderBy(args.orderBy || 't.id', args.orderAsc ? 'asc' : 'desc');

  const rows: TowTable[] = await query
    .select('t.*', st.asGeoJSON('location_geo'), st.asGeoJSON('destination_geo'))
    .distinct();
  const tows = rows.map((t) => towModelFromTable(t));

  if (args.loadDriver) {
    const driverIDs = tows.map((t) => t.driver_id);
    const drivers = await db<Partial<User>>('users as u')
      .select('id', 'first_name', 'last_name', 'email')
      .whereIn('u.id', driverIDs);
    tows.forEach((t) => {
      t.driver = drivers.find((d) => d.id === t.driver_id);
    });
  }

  if (args.loadTowVehicles || args.loadTowVehicleReasons) {
    // Load tow vehicles
    const towIDs = tows.map((t) => t.id);
    const towVehicles = await db<TowVehicleTable>('tow_vehicles as tv').select('*').whereIn('tow_id', towIDs);
    tows.forEach((t) => {
      t.vehicles = towVehicles.filter((tv) => tv.tow_id === t.id);
    });

    if (args.loadTowVehicleReasons) {
      // Load tow vehicle 's reasons
      const tvIDs = towVehicles.map((tv) => tv.id);
      const tvReasons: TowVehicleReasonMap[] = await db('tow_vehicle_reasons as tvr')
        .select('*')
        .whereIn('tow_vehicle_id', tvIDs);

      tows.forEach((t) => {
        t.vehicles.forEach((tv) => {
          tv.reason_ids = tvReasons.filter((r) => r.tow_vehicle_id === tv.id).map((r) => r.tow_reason_id);
        });
      });
    }
  }

  return { tows, paging: { limit: paging.limit, offset: paging.offset, total: Number(totalRow.total) } };
}
