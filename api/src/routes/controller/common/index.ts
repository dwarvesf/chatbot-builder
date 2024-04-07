import { Request, Response } from 'express';
import { getEquipments, getStates, getTowReasons, getVehicleBodies, getVehicleColors } from '../../service/common';

export async function getEquipmentsHandler(req: Request, res: Response) {
  const equipments = await getEquipments();
  res.json(equipments);
}

export async function getVehicleBodiesHandler(req: Request, res: Response) {
  const vehicleBodies = await getVehicleBodies();
  res.json(vehicleBodies);
}

export async function getVehicleColorsHandler(req: Request, res: Response) {
  const vehicleColors = await getVehicleColors();
  res.json(vehicleColors);
}

export async function getStatesHandler(req: Request, res: Response) {
  const states = await getStates();
  res.json(states);
}

export async function getTowReasonsHandler(req: Request, res: Response) {
  const towReasons = await getTowReasons();
  res.json(towReasons);
}
