export interface ITrackable extends ICreationTrackable {
  updated_at?: Date;
  updated_by?: BigInt;
}

export interface ICreationTrackable {
  created_at: Date;
  created_by?: BigInt;
}

export interface ISoftDelete {
  deleted_at?: Date;
  deleted_by?: BigInt;
}
