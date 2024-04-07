import knex, { Knex } from 'knex';
import KnexPostgis from 'knex-postgis';
import pg from 'pg';
import { getEnv, getEnvF } from '../config';

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: getEnvF('DB_HOST'),
    port: parseInt(getEnvF('DB_PORT')),
    user: getEnvF('DB_USERNAME'),
    password: getEnvF('DB_PASSWORD'),
    database: getEnvF('DB_NAME'),
    ssl: getEnv('DB_SSL') === 'true',
  },
  // debug: true,
};

const db = knex(config);
const st = KnexPostgis(db);

// Set parser for numeric type
pg.types.setTypeParser(pg.types.builtins.INT8, BigInt); // This could be a problem if we number is too big??

type IKnexExtendedType = any; // ExtendedKnexRaw is not exported from knex
export function geomFromLongLat(long: number, lat: number): IKnexExtendedType {
  return st.geomFromGeoJSON({ type: 'Point', coordinates: [long, lat] });
}

export default db;
export { st };
