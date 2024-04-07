import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import db from '../../../db/db';
import { User } from '../../../db/models/user';
import logger from '../../../logger';
import { UserDetail } from '../../models/user';
import { getUserDetail } from '../../service/users';
import { getRqUser } from '../../utils/request';
import { validateObj } from '../validator';

class logInBody {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export async function logIn(req: Request, res: Response) {
  const log = logger.child({ fn: 'logIn' });
  const me = getRqUser(req);
  if (me && me.activated_at) {
    res.status(400).json({ message: 'User already logged in' });
    return;
  }

  // Validate request body
  const errMsg = await validateObj(logInBody, req.body);
  if (errMsg) {
    return res.status(400).json({ message: errMsg });
  }

  const { email, password } = req.body;

  const u: User = await db<User>('users')
    .select('id', 'hashed_password', 'activated_at')
    .from('users')
    .where({ email: email.toLowerCase() })
    .first();

  if (u && !u.activated_at) {
    res.status(400).json({ message: 'User is not activated' });
    return;
  }

  if (!u) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  log.info('Check if to validate pwd');
  if (u.hashed_password) {
    log.info('Validate pwd');
    if (Bun.password.verifySync(password, u.hashed_password)) {
      log.info('Pwd is valid');
      const user = await getUserDetail({ id: u.id });

      if (!user.activated_at) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User is not activated' });
      }

      log.info('Login');
      await rqLogin(req, user);
      delete user.hashed_password;
      return res.status(StatusCodes.OK).json(user);
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid email or password' });
    }
  }

  return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid email or password' });
}

export async function rqLogin(req: Request, user: UserDetail) {
  const log = logger.child({ fn: 'rqLogin' });
  return new Promise((resolve, reject) => {
    log.info('rqLogin');
    req.login(user, (err) => {
      log.info(err, 'rqLogin err ? ');
      if (err) {
        log.error(err, 'rqLogin failed');
        return reject(err);
      }
      resolve(null);
    });
  });
}
