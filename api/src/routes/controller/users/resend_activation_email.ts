import { IsEmail, IsNotEmpty } from 'class-validator';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NewAccountActivationLinkExp } from '../../../config';
import { LogTypeEnum } from '../../../db/models/log';
import { redisClient } from '../../../gateway/redis';
import logger from '../../../logger';
import { addLog } from '../../service/log';
import { getUser } from '../../service/users';
import { sendUserActivationEmail } from '../email';
import { validateObj } from '../validator';
import { createActivationLink } from './register_admin';

class ResendActivationEmailBody {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export async function resendActivationEmail(req: Request, res: Response) {
  const log = logger.child({ fn: 'resendActivationEmail' });

  // Validate request body
  const errMsg = await validateObj(ResendActivationEmailBody, req.body);
  if (errMsg) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: errMsg });
  }

  const u = await getUser({ email: req.body.email });
  if (!u || u.activated_at) {
    return res.status(StatusCodes.BAD_GATEWAY).json({ message: 'Invalid email address' });
  }

  // Check if resend email too soon
  const rdKey = `rae_${u.id}`;
  const sentTooSoon = await redisClient.get(rdKey);
  if (sentTooSoon) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Resend email too soon' });
  }

  // Re-send activation email
  try {
    const activationLink = await createActivationLink({
      userID: u.id,
      exp: NewAccountActivationLinkExp,
    });
    await sendUserActivationEmail({ email: u.email, activationLink });
    await addLog({
      type_id: LogTypeEnum.UserActivationEmailResent,
      user_id: u.id,
      created_by: u.id,
    });
  } catch (err) {
    log.error(err, 'resend activation email failed');
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to resend email' });
  }

  // Save last resend time
  await redisClient.set(rdKey, dayjs().toISOString(), {
    EX: 15 * 60, // 15 minutes
  });

  res.status(StatusCodes.OK).json({ message: 'OK' });
}
