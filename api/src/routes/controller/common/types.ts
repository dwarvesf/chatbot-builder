import { IsNumber } from 'class-validator';
import { GeoPoint } from '../../models/geo';

export class GeoPointValidationClz implements GeoPoint {
  @IsNumber()
  lat: number;
  @IsNumber()
  long: number;
}
