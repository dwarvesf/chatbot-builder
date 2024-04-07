import db from '../../db/db';
import { TowAttachmentTable } from '../../db/models/tow_attachment';
import { generateID } from './snowflake';

export async function addTowAttachment(ta: Partial<TowAttachmentTable>, repo = db) {
  const results = await repo<TowAttachmentTable>('tow_attachments')
    .insert({
      ...ta,
      id: generateID(),
      created_at: new Date(),
    })
    .returning('*');

  if (results.length === 0) {
    throw new Error('Failed to create tow attachment record');
  }

  return results[0];
}

export async function getTowDocuments({ towID }: { towID: BigInt }, repo = db) {
  const query = repo<TowAttachmentTable>('tow_attachments as ta').select('ta.*').where('ta.tow_id', '=', towID);
  const attachments = await query;

  return attachments;
}
