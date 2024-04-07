import db from '../../db/db';
import { Equipment } from '../../db/models/equipment';
import { State } from '../../db/models/state';
import { TowReason } from '../../db/models/tow_reasons';
import { VehicleBody } from '../../db/models/vehicle_body';
import { VehicleColor } from '../../db/models/vehicle_color';

export async function getEquipments() {
  return await db<Equipment>('equipments').select('*');
}

export async function getVehicleBodies() {
  return await db<VehicleBody>('vehicle_bodies').select('*');
}

export async function getVehicleColors() {
  return await db<VehicleColor>('vehicle_colors').select('*');
}

export async function getStates() {
  return await db<State>('states').select('*');
}

export async function getTowReasons() {
  return await db<TowReason>('tow_reasons').select('*');
}
