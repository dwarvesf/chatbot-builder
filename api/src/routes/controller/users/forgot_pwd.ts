import { Request, Response } from 'express';

import dayjs from 'dayjs';
import { ForgotPasswordLinkExp, WebAppResetPasswordPageURL } from '../../../config';
import db from '../../../db/db';
import { LogTypeEnum } from '../../../db/models/log';
import { redisClient } from '../../../gateway/redis';
import logger from '../../../logger';
import { JWT_TYPE_FORGOT_PWD, createJwtToken, verifyJwtToken } from '../../service/jwt';
import { addLog } from '../../service/log';
import { getUser, getUserDetail, isUserNameExists, updateUser } from '../../service/users';
import { sendUserForgotPasswordEmail } from '../email';

export async function forgotPasswordHandler(req: Request, res: Response) {
  const email = req.body.email;

  const emailExist = await isUserNameExists(email);
  if (!emailExist) return res.status(404).json({ message: 'No email was found!' });

  const user = await getUserDetail({ email: email });
  const userID = BigInt(user.id);
  const rdKey = `rrr_${userID}`; // redis resend rate
  const sentTooSoon = await redisClient.get(rdKey);
  if (sentTooSoon) return res.status(400).json({ message: 'Resend email too soon.' });

  try {
    const forgotPwdLink = await createForgotPasswordLink({ userID, exp: ForgotPasswordLinkExp });
    await sendUserForgotPasswordEmail({ email: email, forgotPasswordLink: forgotPwdLink });
  } catch (err) {
    logger.error(err, 'send forgot password link failed');
  }
  await redisClient.set(rdKey, dayjs().toISOString(), {
    EX: 15 * 60,
  });
  return res.status(200).json({ message: 'Reset Password Link was sent!' });
}

async function createForgotPasswordLink({ userID, exp }: { userID: BigInt; exp: string }) {
  const passwordResetToken = await createJwtToken({
    userID,
    type_id: JWT_TYPE_FORGOT_PWD,
    exp: '15m',
  });
  const forgotPwdURL = new URL(`${WebAppResetPasswordPageURL}`);
  forgotPwdURL.searchParams.append('token', passwordResetToken);
  const forgotPwdLink = forgotPwdURL.toString();
  return forgotPwdLink;
}

export async function resetPasswordHandler(req: Request, res: Response) {
  // validate token
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ message: 'Token is required!' });

  const decoded = await verifyJwtToken(token);
  const userIDStr = decoded.user_id as string;
  // validate toke type
  const tokenType = decoded.type_id;
  if (tokenType !== JWT_TYPE_FORGOT_PWD) return res.status(400).json({ message: 'Invalid token!' });
  const userID = BigInt(userIDStr);

  // Verify if token is already used
  const tkHash = Bun.hash(token);
  const rdKey = `rpt_${tkHash}`;
  const used = await redisClient.get(rdKey);
  if (used) {
    res.status(400).json({ message: 'Invalid token!' });
  }

  const new_password = req.body.new_password;
  const user = await getUser({ id: userID });
  if (!user) return res.status(400).json({ message: 'user not found!' });
  const newPwd = Bun.password.hashSync(new_password);

  await db.transaction(async (trx) => {
    await updateUser(
      {
        id: userID,
        hashed_password: newPwd,
        pwd_change_required: false,
      },
      trx
    );

    await addLog({ type_id: LogTypeEnum.UserPwdChanged, user_id: userID, created_by: userID }, trx);
  });

  // Store used token to redis as hash
  redisClient.set(rdKey, 1, {
    PX: 900000,
  });

  return res.status(200).json({ message: 'OK' });
}
