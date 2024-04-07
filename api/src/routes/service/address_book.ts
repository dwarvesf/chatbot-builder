import db from '../../db/db';
import { AddressBook } from '../../db/models/address_book';
import { Pagination } from '../../db/models/paging';
import { generateID } from './snowflake';

export async function getAddressBook(
  { companyID, id, name }: { companyID?: number; id?: BigInt; name?: string },
  repo = db
) {
  const query = repo<AddressBook>('address_books').whereNull('deleted_at');
  if (id) query.where({ id });
  if (companyID) query.where({ company_id: companyID });
  if (name) query.where({ name });

  const anAddressBook = query.first();
  return anAddressBook;
}

export async function getAddressBooks(
  {
    companyID,
    name,
    address1,
    city,
    stateIds,
    searchText,
    offset = 0,
    limit = 100,
  }: {
    companyID: number;
    name?: string;
    address1?: string;
    city?: string;
    stateIds?: number[];
    searchText?: string;
    offset: number;
    limit: number;
  },
  repo = db
) {
  const query = repo<AddressBook>('address_books').where({ company_id: companyID }).whereNull('deleted_at');
  if (stateIds && stateIds.length > 0) {
    query.andWhere('states.id', 'in', stateIds);
  }

  if (searchText) {
    query.join('states as s', 's.id', 'address_books.state_id');

    query.where((qb) => {
      qb.where('address_books.name', 'ilike', `%${searchText}%`)
        .orWhere('address_books.address1', 'ilike', `%${searchText}%`)
        .orWhere('s.name', 'ilike', `%${searchText}%`)
        .orWhere('address_books.city', 'ilike', `%${searchText}%`);
    });
  }

  if (name) query.whereILike('address_books.name', `%${name}%`);
  if (address1) query.whereILike('address_books.address1', `%${address1}%`);
  if (city) query.whereILike('address_books.city', `%${city}%`);

  const countRows = await query.clone().count();
  const addressBooks = await query
    .offset(offset)
    .limit(limit)
    .orderBy('address_books.created_at')
    .select('address_books.*');

  const count = Number(countRows[0].count);
  const paging: Pagination = {
    offset,
    limit,
    total: count,
  };

  return {
    addressBooks,
    paging,
  };
}

type INewAddressBook = Omit<AddressBook, 'id' | 'created_at'>;
export async function createAddressBook(ab: INewAddressBook, repo = db) {
  const query = repo<AddressBook>('address_books').where({ company_id: ab.company_id });
  const createdNewAddressBook = await query
    .insert({
      ...ab,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('*');

  return createdNewAddressBook[0];
}

export async function deleteAddressBook(ab: Partial<AddressBook>, repo = db) {
  const query = repo<AddressBook>('address_books').where({ company_id: ab.company_id }).whereNull('deleted_at');
  await query.andWhere({ id: ab.id }).update({
    ...ab,
    deleted_at: new Date(),
  });
}

export async function updateAddressBook(ab: Partial<AddressBook>, repo = db) {
  const query = repo<AddressBook>('address_books').where({ company_id: ab.company_id }).whereNull('deleted_at');
  await query.andWhere({ id: ab.id }).update({
    ...ab,
    updated_at: new Date(),
  });
}
