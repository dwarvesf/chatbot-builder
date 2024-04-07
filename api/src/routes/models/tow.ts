import { TowTable } from '../../db/models/tow';
import { TowAttachmentTable } from '../../db/models/tow_attachment';
import { LocationData } from '../../db/models/types';
import { User } from '../../db/models/user';
import { GeoPoint } from './geo';

export interface Tow extends Omit<TowTable, 'requested_time'> {
  location_geo?: GeoPoint;
  destination_geo?: GeoPoint;
  requested_time?: string;

  // Foreign keys
  driver?: User;
  vehicles?: TowVehicle[];
  documents?: TowAttachmentTable[];
}

export function towModelFromTable(t: TowTable): Tow {
  if (!t) {
    return null;
  }

  const m: Tow = {
    ...t,
    location_geo: geoPointFromJSONGeo(t?.location_geo),
    destination_geo: geoPointFromJSONGeo(t?.destination_geo),
    vehicles: [],
  } as any;

  return m;
}

export interface TowVehicle {
  id?: BigInt;
  make?: string;
  color_id?: number;
  model?: string;
  year?: number;
  no_vin?: boolean;
  vin?: string;
  body_id?: number;
  no_plate?: boolean;
  license?: string;
  state_id?: number;
  reason_ids?: number[];
}

interface PostgresGeoPoint {
  type: string;
  coordinates: [number, number];
}

function geoPointFromJSONGeo(jsData: LocationData): GeoPoint {
  const p: PostgresGeoPoint = JSON.parse(jsData as string) || {};
  return {
    long: p?.coordinates[0],
    lat: p?.coordinates[1],
  };
}
