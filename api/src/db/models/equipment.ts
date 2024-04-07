import { ITrackable } from './base';

export interface Equipment extends ITrackable {
  id: number;
  name: string;
  description?: string;
}
