import { BaseMessage } from 'firebase-admin/messaging';
import db from '../../../db/db';
import { RoleEnum } from '../../../db/models/role';
import logger from '../../../logger';
import { UserDetail } from '../../models/user';
import { getDevices } from '../../service/device';
import { getUser, getUserRoleEnums } from '../../service/users';
import { sendFCMMessageToDevice } from './notification';

export function haveRole(u: UserDetail, roleId: number) {
  return u.roles.includes(roleId);
}

export async function doesUserHaveRole(userID: BigInt, role: RoleEnum): Promise<boolean> {
  const userRoles = await getUserRoleEnums(userID);
  return userRoles.some((r) => r === role);
}

export async function sendFCMMessageToUser(userID: BigInt, msg: BaseMessage, repo = db) {
  const log = logger.child({ func: 'sendFCMMessageToUser' });

  const fcmTokens: string[] = [];

  const u = await getUser({ id: userID }, repo);
  if (u.fcm_token) {
    fcmTokens.push(u.fcm_token);
  }

  const devices = await getDevices({ user_id: userID, repo });
  devices.forEach((d) => {
    if (d.fcm_token) {
      // fcmTokens.push(d.fcm_token);
      sendFCMMessageToDevice(msg, d)
        .then((response) => {
          // log.info('Successfully sent notification ');
        })
        .catch((err) => {
          log.error(err, 'Failed to send notification');
        });
    }
  });
}
