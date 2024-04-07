import { Knex } from 'knex';
import db from '../../db/db';
import { LogTable, LogTypeEnum } from '../../db/models/log';
import { Pagination } from '../../db/models/paging';
import { generateID } from './snowflake';

type INewLog = Omit<LogTable, 'id' | 'created_at'>;
export async function addLog(l: INewLog, repo: Knex = db) {
  const createdLogs = await repo<LogTable>('logs')
    .insert({
      ...l,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('*');

  if (!createdLogs || createdLogs.length === 0) {
    return null;
  }
  return createdLogs[0];
}

export async function getLog({ id }: { id: BigInt }, repo = db) {
  const log = await repo<LogTable>('logs').where({ id }).first();
  return log;
}

export async function getLogs(
  {
    ids,
    towID,
    paging,
    typeIds,
    from,
    to,
    userIds,
    companyId,
    metadataFilter,
  }: {
    ids?: BigInt[];
    towID?: BigInt;
    paging: Pagination;
    typeIds?: LogTypeEnum[];
    from?: Date;
    to?: Date;
    userIds?: BigInt[];
    companyId?: number;
    metadataFilter?: Record<string, string>;
  },
  repo = db
) {
  const query = repo<LogTable>('logs');

  if (ids && ids.length > 0) {
    query.whereIn('logs.id', ids);
  }

  if (from) {
    query.where('logs.created_at', '>=', from);
  }

  if (to) {
    query.where('logs.created_at', '<=', to);
  }

  if (towID) {
    query.where('logs.tow_id', '=', towID);
  }

  if (typeIds && typeIds.length > 0) {
    query.whereIn('logs.type_id', typeIds);
  }

  if (userIds && userIds.length > 0) {
    query.whereIn('logs.user_id', userIds);
  }

  if (companyId) {
    query.join('users', 'logs.created_by', '=', 'users.id').where('users.company_id', '=', companyId);
  }

  if (metadataFilter) {
    query.where('logs.metadata', '@>', metadataFilter);
  }

  // Count
  const countRow = await query.clone().count('logs.id', { as: 'count' }).first();

  // Pagination
  const logs = await query
    .limit(paging.limit)
    .offset(paging.offset)
    .orderBy('logs.created_at', 'desc')
    .select('logs.*');

  return {
    logs,
    paging: {
      ...paging,
      total: Number(countRow?.count),
    },
  };
}
