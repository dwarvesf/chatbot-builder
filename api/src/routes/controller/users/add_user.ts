import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Request, Response } from 'express';
import db from '../../../db/db';
import { LogTypeEnum } from '../../../db/models/log';
import { RoleEnum } from '../../../db/models/role';
import logger from '../../../logger';
import { addLog } from '../../service/log';
import { nextUserNumber } from '../../service/sequence';
import { addUser, addUserRole } from '../../service/users';
import { getRqUser, getRqUserID } from '../../utils/request';
import { validateObj } from '../validator';

class newUserRequestBody {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsIn([RoleEnum.ADMIN, RoleEnum.DISPATCHER, RoleEnum.DRIVER])
  role_id: number;

  @IsEmail()
  email: string;

  @IsString()
  phone_number: string;

  @IsString()
  password: string;

  @IsString()
  permit: string;
}

export async function addUserHandler(req: Request, res: Response) {
  // Validate
  const errMsg = await validateObj(newUserRequestBody, req.body);
  if (errMsg) {
    return res.status(400).json({ message: errMsg });
  }

  // Add user
  const { first_name, last_name, role_id, email, phone_number, password, permit } = req.body;
  let createdUserID: BigInt;
  try {
    const hashed_password = await Bun.password.hash(password);
    await db.transaction(async (trx) => {
      // Check if user already exists
      const userEmailExisted = await trx('users').where({ email }).first();
      if (userEmailExisted) {
        return res.status(400).json({ message: 'Email already existed' });
      }

      const { company_id } = getRqUser(req);
      const userNumber = await nextUserNumber(company_id, trx);
      const user = await addUser({
        u: {
          user_number: userNumber,
          first_name,
          last_name,
          company_id,
          email,
          phone: phone_number,
          hashed_password,
          pwd_change_required: true,
          activated_at: new Date(),
          created_by: getRqUserID(req),
          permit: permit.toLowerCase(),
        },
        repo: trx,
      });
      createdUserID = user.id;

      await addUserRole(
        {
          userID: user.id,
          roleID: role_id,
        },
        trx
      );

      await addLog({ type_id: LogTypeEnum.UserAdded, user_id: createdUserID, created_by: getRqUserID(req) }, trx);
    });
  } catch (err) {
    logger.error(err, 'Add user failed');
    return res.status(500).json({ message: 'Internal server error' });
  }

  res.status(200).json({ user_id: createdUserID.toString() });
}
