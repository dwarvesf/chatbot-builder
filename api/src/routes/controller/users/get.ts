import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getUser } from '../../service/users';
import { getRqUser } from '../../utils/request';

export async function getUserHandler(req: Request, res: Response) {
  const { id: idStr } = req.params;

  let userID: BigInt;
  try {
    userID = BigInt(idStr);
  } catch (e) {
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid user ID' });
  }

  const me = getRqUser(req);
  const u = await getUser({ id: userID, companyID: me.company_id });

  if (!u) {
    return res.status(StatusCodes.NOT_FOUND).send({ message: 'User not found' });
  }

  delete u.hashed_password;
  return res.status(StatusCodes.OK).send(u);
}
