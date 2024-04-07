import db from '../../db/db';
import { Sequence } from '../../db/models/sequence';

export async function nextTowNumber(company_id: number, repo = db) {
  const key = `tow_number_${company_id}`;
  return await nextSequenceNumber(key, repo, { minNewIfNotExisted: 999 });
}

export async function nextUserNumber(company_id: number, repo = db) {
  const key = `user_number_${company_id}`;
  return await nextSequenceNumber(key, repo, { minNewIfNotExisted: 99 });
}

export async function nextTruckNumber(company_id: number, repo = db) {
  const key = `truck_number_${company_id}`;
  return await nextSequenceNumber(key, repo, { minNewIfNotExisted: 99 });
}

async function nextSequenceNumber(name: string, repo = db, { minNewIfNotExisted } = { minNewIfNotExisted: 0 }) {
  const s = await repo<Sequence>('sequences').where({ name }).first();
  if (!s) {
    // Create sequence if it doesn't exist
    await repo<Sequence>('sequences').insert({
      name,
      value: minNewIfNotExisted + 1,
    });
    return minNewIfNotExisted + 1;
  }

  const nextNumber = await repo<Sequence>('sequences').where({ name }).increment('value', 1).returning('value');
  return nextNumber[0].value;
}
