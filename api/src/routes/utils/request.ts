import { Request } from 'express';
import { UserDetail } from '../models/user';

export function getRqUser(req: Request): UserDetail {
  return req.user as UserDetail;
}

export function getRqUserID(req: Request): BigInt {
  return BigInt(getRqUser(req).id);
}
