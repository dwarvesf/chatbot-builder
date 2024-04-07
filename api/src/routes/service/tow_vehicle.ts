import db from '../../db/db';
import { TowVehicleTable } from '../../db/models/tow_vehicle';
import { TowVehiclePhotoTable } from '../../db/models/tow_vehicle_photo';
import { generateID } from './snowflake';

export async function getTowVehicles({ towID }: { towID?: BigInt }): Promise<TowVehicleTable[]> {
  const query = db<TowVehicleTable>('tow_vehicles');

  if (towID) {
    query.where('tow_id', towID);
  }

  const towVehicle = await query.select('*');
  return towVehicle;
}

export async function getTowVehicle({ id }: { id: BigInt }, repo = db): Promise<TowVehicleTable> {
  const towVehicle = await repo<TowVehicleTable>('tow_vehicles').where({ id }).first();
  return towVehicle;
}

export async function getTowVehiclePhotos({ towVehicleID }: { towVehicleID?: BigInt }) {
  const query = db('tow_vehicle_photos');

  if (towVehicleID) {
    query.where('tow_vehicle_id', towVehicleID);
  }

  const towVehiclePhotos = await query.select('*');
  return towVehiclePhotos;
}

export async function getTowVehicleReasons({ towVehicleID }: { towVehicleID?: BigInt }) {
  const query = db('tow_vehicle_reasons');

  if (towVehicleID) {
    query.where('tow_vehicle_id', towVehicleID);
  }

  const towVehicleReasons = await query.select('*');
  return towVehicleReasons;
}

export async function updateTowVehicle(towVehicle: Partial<TowVehicleTable>, repo = db) {
  await repo<TowVehicleTable>('tow_vehicles').where({ id: towVehicle.id }).update(towVehicle);
}

export async function deleteTowVehicleReasons({ towVehicleID }: { towVehicleID: BigInt }, repo = db) {
  await repo('tow_vehicle_reasons').where({ tow_vehicle_id: towVehicleID }).delete();
}

export async function createTowVehicle(v: Partial<TowVehicleTable>, repo = db) {
  const towVehicleID = generateID();
  await repo<TowVehicleTable>('tow_vehicles').insert({
    id: towVehicleID,
    tow_id: v.tow_id,
    make: v.make,
    color_id: v.color_id,
    model: v.model,
    year: v.year,
    vin: v.vin,
    body_id: v.body_id,
    license: v.license,
    state_id: v.state_id,
    created_at: new Date(),
    created_by: v.created_by,
  });

  return towVehicleID;
}

export async function createTowVehicleReasons(
  {
    towVehicleID,
    towReasonIDs = [],
    createdBy,
  }: {
    towVehicleID: BigInt;
    towReasonIDs: number[];
    createdBy: BigInt;
  },
  repo = db
) {
  for (const r of towReasonIDs) {
    await repo('tow_vehicle_reasons').insert({
      id: generateID(),
      tow_vehicle_id: towVehicleID,
      tow_reason_id: r,
      created_at: new Date(),
      created_by: createdBy,
    });
  }
}

export async function addTowVehiclePhoto(photo: Partial<TowVehiclePhotoTable>, repo = db) {
  const rows = await repo<TowVehiclePhotoTable>('tow_vehicle_photos')
    .insert({
      ...photo,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('*');

  return rows[0];
}
