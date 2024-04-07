import { Router } from 'express';
import 'express-async-errors';
import multer from 'multer';
import { PermissionEnum } from '../db/models/permission';
import { User } from '../db/models/user';
import { getLogsHandler } from './controller/logs/get';
import { activateNewUser } from './controller/users/activate';
import { userChangePasswordHandler } from './controller/users/change_pwd';
import { forgotPasswordHandler, resetPasswordHandler } from './controller/users/forgot_pwd';
import { logIn } from './controller/users/login';
import { registerNewAdminUser } from './controller/users/register_admin';
import { resendActivationEmail } from './controller/users/resend_activation_email';
import { havePermissions, loggedIn } from './middlewares/user';

const v1Router = Router();

const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 25, // 25MB
  },
});

configureCommonRoutes(v1Router);
configureAdminRoutes(v1Router);

function configureCommonRoutes(r: Router) {
  r.get('/logs', havePermissions([PermissionEnum.GET_LOGS]), getLogsHandler);

  r.get('/users/me', loggedIn, (req, res) => {
    const u = req.user as User;
    delete u.hashed_password;
    res.json(req.user);
  });

  r.post('/users/register', registerNewAdminUser);
  r.post('/users/register/resend-activation-email', resendActivationEmail);
  r.post('/users/login', logIn);
  r.get('/users/activate', activateNewUser);

  r.put('/users/change-password', loggedIn, userChangePasswordHandler);
  r.post('/users/forgot-password', forgotPasswordHandler);
  r.put('/users/forgot-password/reset', resetPasswordHandler);

  // Devices
  r.post('/users/logout', loggedIn, (req, res) => {
    req.logout({}, () => res.status(200).json({ message: 'OK' }));
  });
}

function configureAdminRoutes(r: Router) {
  // Admin routes
}

export { v1Router };
