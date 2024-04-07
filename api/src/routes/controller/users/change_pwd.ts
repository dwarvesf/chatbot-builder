import { Request, Response } from 'express';
import db from '../../../db/db';
import { LogTypeEnum } from '../../../db/models/log';
import { addLog } from '../../service/log';
import { updateUser } from '../../service/users';
import { getRqUser, getRqUserID } from '../../utils/request';

export async function userChangePasswordHandler(req: Request, res: Response) {
  const { old_password, new_password } = req.body;
  const user = getRqUser(req);
  if (!user) {
    return res.status(401).json({ message: 'User not logged in' });
  }
  if (!user.activated_at) {
    return res.status(401).json({ message: 'User not activated' });
  }

  if (Bun.password.verifySync(old_password, user.hashed_password) === false) {
    return res.status(401).json({ message: 'Old password is incorrect' });
  }

  const newPwd = Bun.password.hashSync(new_password);

  await db.transaction(async (trx) => {
    await updateUser(
      {
        id: BigInt(user.id),
        hashed_password: newPwd,
        pwd_change_required: false,
      },
      trx
    );
    await addLog({ type_id: LogTypeEnum.UserPwdChanged, user_id: getRqUserID(req), created_by: getRqUserID(req) }, trx);
  });

  return res.status(200).json({ message: 'OK' });
}
