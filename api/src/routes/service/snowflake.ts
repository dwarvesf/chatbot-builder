import { Snowflake } from 'nodejs-snowflake';

const t = new Date(2023, 1, 1, 0, 0, 0, 0);
const uid = new Snowflake({
  custom_epoch: t.getTime(),
});

export function generateID() {
  return uid.getUniqueID();
}
