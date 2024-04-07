import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PermissionEnum } from '../../db/models/permission';
import { RoleEnum } from '../../db/models/role';
import { UserStatusEnum } from '../../db/models/user';
import { getRqUser } from '../utils/request';

export function haveRoles(roles: RoleEnum[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getRqUser(req);
    if (user && user.roles && user.roles.some((r) => roles.includes(r))) {
      next();
    } else {
      res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden' });
    }
  };
}

export function havePermissions(permissions: PermissionEnum[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getRqUser(req);
    if (user && user.permissions && user.permissions.some((p) => permissions.includes(p))) {
      next();
    } else {
      res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden' });
    }
  };
}

export function loggedIn(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const user = getRqUser(req);
    if (!user || !user.activated_at) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not activated' });
    }

    next();
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not logged in' });
  }
}

export function driverLoggedIn(req: Request, res: Response, next: NextFunction) {
  const user = getRqUser(req);
  if (user) {
    const haveDriverRole = user.roles.includes(RoleEnum.DRIVER);
    if (!haveDriverRole) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not driver' });
    }

    if (user.status_id === UserStatusEnum.DRIVER_FORCED_LOGOUT) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User is forced logout' });
    }
  }

  next();
}

export function loggedInButNotActivated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not logged in' });
  }
}
