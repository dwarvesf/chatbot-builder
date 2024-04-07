import dayjs from 'dayjs';
import { readFileSync } from 'fs';
import * as jose from 'jose';
import { JwtPrivateKeyPath, JwtPublicKeyPath } from '../../config';

export const JWT_TYPE_ACTIVATE_ACCOUNT = 1;
export const JWT_TYPE_FORGOT_PWD = 2;

let privateKey: jose.KeyLike;
const keyAlg = 'RS512';
async function getSingletonJwtKey() {
  if (!privateKey) {
    const keyBuf = readFileSync(JwtPrivateKeyPath);
    const pkcs8 = keyBuf.toString();
    privateKey = await jose.importPKCS8(pkcs8, keyAlg);
  }
  return privateKey;
}

let publicKey: jose.KeyLike;
async function getSingletonPublicKey() {
  if (!publicKey) {
    const rawPubKey = await readFileSync(JwtPublicKeyPath);
    publicKey = await jose.importSPKI(rawPubKey.toString(), keyAlg);
  }
  return publicKey;
}

export async function createJwtToken({
  userID,
  type_id,
  exp = '24h',
}: {
  userID: BigInt;
  type_id: number;
  exp?: string;
}) {
  const jwtKey = await getSingletonJwtKey();

  const jwt = await new jose.SignJWT({
    user_id: userID.toString(),
    type_id: type_id,
  })
    .setProtectedHeader({ alg: keyAlg })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(jwtKey);

  return jwt;
}

export async function verifyJwtToken(token: string) {
  const pubKey = await getSingletonPublicKey();

  const { payload, protectedHeader } = await jose.jwtVerify(token, pubKey, {
    algorithms: [keyAlg],
  });

  if (!payload.user_id) throw new Error('Invalid token. Missing user_id');
  if (!payload.type_id) throw new Error('Invalid token. Missing type_id');
  if (!payload.exp) throw new Error('Invalid token. Missing exp');
  if (!payload.iat) throw new Error('Invalid token. Missing iat');

  const nowUnix = dayjs().unix();
  if (nowUnix > payload.exp) throw new Error('Token expired');
  if (nowUnix < payload.iat) throw new Error('Invalid token. iat is in the future');

  return payload;
}
