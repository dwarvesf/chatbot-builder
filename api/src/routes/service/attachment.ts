import db from '../../db/db';
import { AttachmentTable } from '../../db/models/attachment';

export async function createAttachmentRecord(attachment: Partial<AttachmentTable>, repo = db) {
  const results = await db<AttachmentTable>('attachments')
    .insert({
      ...attachment,
      created_at: new Date(),
    })
    .returning('*');

  if (results.length === 0) {
    throw new Error('Failed to create attachment record');
  }
  return results[0];
}

export async function getAttachment(
  { id, companyID, createdBy }: { id?: BigInt; companyID?: number; createdBy?: BigInt },
  repo = db
) {
  const query = repo<AttachmentTable>('attachments as a');

  if (id) {
    query.where('a.id', '=', id);
  }

  if (createdBy) {
    query.where('a.created_by', '=', createdBy);
  }

  if (companyID) {
    query.join('users as u', 'u.id', 'a.created_by');
    query.where('u.company_id', '=', companyID);
  }

  const attachment = await query.first();
  return attachment;
}

export async function getAttachments(
  { ids, companyID, createdBy }: { ids?: BigInt[]; companyID?: number; createdBy?: BigInt },
  repo = db
) {
  const query = repo<AttachmentTable>('attachments as a');

  if (ids && ids.length > 0) {
    query.whereIn('a.id', ids);
  }

  if (createdBy) {
    query.where('a.created_by', '=', createdBy);
  }

  if (companyID) {
    query.join('users as u', 'u.id', 'a.created_by');
    query.where('u.company_id', '=', companyID);
  }

  const attachments = await query;
  return attachments;
}
