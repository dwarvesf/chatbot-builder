import passport from 'passport';
import logger from './logger';
import { getUserDetail } from './routes/service/users';

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
interface INonStrictUser {
  id?: BigInt;
}
passport.serializeUser((u: INonStrictUser, cb) => {
  try {
    cb(null, { id: u.id.toString() });
  } catch (err) {
    logger.error(err, 'serializeUser err');
    cb(err);
  }
});

passport.deserializeUser(async (u: { id: string }, cb) => {
  if (!u || !u.id) {
    return cb(null, false);
  }
  try {
    const id = BigInt(u.id);
    const user = await getUserDetail({ id });
    if (!user) {
      return cb(null, false);
    }

    cb(null, user);
  } catch (err) {
    logger.error(err, 'deserializeUser failed');
    cb(err);
  }
});
