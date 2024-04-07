import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Knex } from 'knex';
import { AccountActivatedRedirectUrl } from '../../../config';
import db from '../../../db/db';
import { LogTypeEnum } from '../../../db/models/log';
import { User } from '../../../db/models/user';
import { verifyJwtToken } from '../../service/jwt';
import { addLog } from '../../service/log';

export async function activateNewUser(req: Request, res: Response) {
  const token = req.query.token as string;
  if (!token) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Token is required' });
  }

  // Validate token is valid ( not expired )
  const decoded = await verifyJwtToken(token);
  const userIDStr = decoded.user_id as string;
  const userID = BigInt(userIDStr);

  // Validate user is not activated
  const u: User = await db<User>('users').select('activated_at').where({ id: userID }).first();
  if (!u) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid token' });
  }
  if (u.activated_at) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User already activated' });
  }

  await db.transaction(async (trx) => {
    await setUserActivated({ userID }, trx);
    await addLog({ type_id: LogTypeEnum.UserActivated, user_id: userID, created_by: userID }, trx);
  });

  // Try log out user to force re-login

  try {
    req.logout({}, () => {});
  } catch (error) {
    // Ignore error
  }

  return res.status(StatusCodes.TEMPORARY_REDIRECT).redirect(AccountActivatedRedirectUrl);
}

async function setUserActivated({ userID }: { userID: BigInt }, repo: Knex = db) {
  return await repo<User>('users').where({ id: userID }).update({
    activated_at: new Date(),
    updated_at: new Date(),
  });
}
