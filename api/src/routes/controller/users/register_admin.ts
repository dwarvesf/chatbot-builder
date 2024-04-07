import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiHost, NewAccountActivationLinkExp } from '../../../config';
import db from '../../../db/db';
import { LogTypeEnum } from '../../../db/models/log';
import logger from '../../../logger';
import { addCompany } from '../../service/company';
import { JWT_TYPE_ACTIVATE_ACCOUNT, createJwtToken } from '../../service/jwt';
import { addLog } from '../../service/log';
import { nextUserNumber } from '../../service/sequence';
import { addUser, getUserDetail, isUserNameExists as isEmailExists } from '../../service/users';
import { sendUserActivationEmail } from '../email';

interface registerNewAdminUserRequestBody {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  company_name: string;
}

export async function registerNewAdminUser(req: Request, res: Response) {
  const log = logger.child({ fn: 'registerNewAdminUser' });

  const rqBody = req.body as registerNewAdminUserRequestBody;

  //Check company name is unique
  const companyExists = await db('companies').select('id').where({ name: rqBody.company_name }).first();
  if (companyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      code: 'company_name_exists',
      message: 'Company name already exists',
    });
  }

  let userID: BigInt;
  await db
    .transaction(async (trx) => {
      // Check email is unique
      const emailExists = await isEmailExists(rqBody.email);
      if (emailExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 'email_exists',
          message: 'Email already exists',
        });
      }

      const customerID = await createUniqueCustomerID();
      const company = await addCompany({
        c: { name: rqBody.company_name, customer_id: customerID },
        repo: trx,
      });

      const userNumber = await nextUserNumber(company.id, trx);
      const u = await addUser({
        u: {
          user_number: userNumber,
          phone: rqBody.phone,
          first_name: rqBody.first_name,
          last_name: rqBody.last_name,
          email: rqBody.email.toLowerCase(),
          hashed_password: Bun.password.hashSync(rqBody.password),
        },
        repo: trx,
      });
      userID = u.id;

      // Add admin role to user
      await addLog({ type_id: LogTypeEnum.UserRegistered, user_id: userID, created_by: userID }, trx);
    })
    .catch((err) => {
      log.error(err, 'tx failed');
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err });
    });

  try {
    // Send activation link to email
    const activationLink = await createActivationLink({
      userID,
      exp: NewAccountActivationLinkExp,
    });
    await sendUserActivationEmail({ email: rqBody.email, activationLink });
  } catch (err) {
    log.error(err, 'send activation email failed');
  }

  // Return user detail
  const user = await getUserDetail({ id: userID });
  delete user.hashed_password;
  return res.status(StatusCodes.CREATED).json(user);
}

export async function createActivationLink({ userID, exp }: { userID: BigInt; exp: string }) {
  // Generate token from email and userID
  const token = await createJwtToken({
    userID,
    type_id: JWT_TYPE_ACTIVATE_ACCOUNT,
    exp,
  });

  const activationURL = new URL(`${ApiHost}/api/v1/users/activate`);
  activationURL.searchParams.append('token', token);

  const activationLink = activationURL.toString();
  return activationLink;
}

async function createUniqueCustomerID(repo = db) {
  let customerID = randomCustomerID();

  let customerIDExisted = false;
  do {
    customerIDExisted = await customerIDExists(customerID, repo);
    if (customerIDExisted) {
      customerID = randomCustomerID();
    }
  } while (customerIDExisted);
  return customerID;
}

function randomCustomerID() {
  // Customer is 6 digits, so we generate a random number between 0.1 and 1
  let r = 0;
  while (r < 0.1) {
    r = Math.random();
  }

  return Math.floor(r * 1e6);
}

async function customerIDExists(customerID: number, repo = db): Promise<boolean> {
  const company = await repo('companies').select('id').where({ customer_id: customerID }).first();
  return !!company;
}
