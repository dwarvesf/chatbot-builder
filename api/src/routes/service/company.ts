import { Knex } from 'knex';
import db from '../../db/db';
import { Company } from '../../db/models/company';
import { User } from '../../db/models/user';

export async function getCompany({
  id,
  name,
  address,
  city,
  state,
  zipCode,
  phoneNumber,
  repo = db,
}: {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  state?: number;
  zipCode?: string;
  phoneNumber?: string;
  repo?: Knex;
}) {
  const query = repo<Company>('companies');

  if (id) query.where('id', '=', id);
  if (name) query.where({ name });
  if (address) query.where({ address });
  if (city) query.where({ city });
  if (state) query.where('state_id', '=', state);
  if (zipCode) query.where({ zipcode: zipCode });
  if (phoneNumber) query.where({ phone_number: phoneNumber });

  const company = query.first();

  return company;
}

export async function getCompanyIDs({ user_ids, repo = db }: { user_ids: BigInt[]; repo?: Knex }) {
  const query = repo<User>('users').whereIn('id', user_ids).select('company_id').distinct();
  const rows = await query;
  const companyIDs = rows.map((u) => Number(u.company_id));
  return companyIDs;
}

type INewCompany = Omit<Company, 'id' | 'created_at' | 'updated_at' | 'logo_attachment_id'>;
export async function addCompany({ c, repo = db }: { c: INewCompany; repo?: Knex }) {
  const companies: Company[] = await repo<Company>('companies')
    .insert({
      ...c,
      created_at: new Date(),
    })
    .returning('*');

  return companies[0];
}

export async function updateCompany({ id, c, repo = db }: { id: number; c: Partial<Company>; repo?: Knex }) {
  const query = repo<Company>('companies').where({ id });
  await query.update({
    ...c,
    updated_at: new Date(),
  });
}
