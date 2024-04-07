import { IsArray, IsDateString, IsJSON, IsNumberString, ValidateIf } from 'class-validator';
import { Request, Response } from 'express';
import { LogTypeEnum } from '../../../db/models/log';
import logger from '../../../logger';
import { getLogs } from '../../service/log';
import { getRqUser } from '../../utils/request';
import { getRqPaging } from '../utils';
import { notNullOrEmpty, validateObj } from '../validator';

class validateRequest {
  @ValidateIf(notNullOrEmpty)
  @IsArray()
  @IsNumberString({}, { each: true })
  type_ids: string[];

  @ValidateIf(notNullOrEmpty)
  @IsNumberString()
  tow_id: string;

  @IsDateString()
  from: string;

  @ValidateIf((o) => o.to)
  @IsDateString()
  to: string;

  @ValidateIf(notNullOrEmpty)
  @IsNumberString({}, { each: true })
  user_ids: string[];

  @ValidateIf(notNullOrEmpty)
  @IsJSON()
  metadata: string;
}

export async function getLogsHandler(req: Request, res: Response) {
  const { tow_id: towIDStr } = req.query;
  const errMsg = await validateObj(validateRequest, req.query);
  if (errMsg) return res.status(400).json({ message: errMsg });

  let typeIds: LogTypeEnum[] = [];
  if (req.query.type_ids) {
    typeIds = (req.query.type_ids as string[]).map((type_ids) => Number(type_ids));
  }

  /** Convert query string to date format with getLogs() */
  const fromStr = req.query.from as string;
  const toStr = req.query.to as string;
  if (fromStr && toStr) {
    var from = new Date(fromStr);
    var to = new Date(toStr);
  }

  let towID: BigInt;
  if (towIDStr) {
    towID = BigInt(towIDStr as string);
  }

  let metadataFilter: Record<string, string> = {};
  if (req.query.metadata) {
    metadataFilter = JSON.parse(req.query.metadata as string);
  }

  const userIdStr = req.query.user_ids as string[];
  let userIds: BigInt[] = [];
  if (userIdStr && userIdStr.length > 0) {
    /** Validate user ID BigInt */
    try {
      userIds = userIdStr.map((user_ids) => BigInt(user_ids));
    } catch (err) {
      logger.error(err);
      return res.status(400).json({ message: 'Invalid User ID' });
    }
  }

  const paging = getRqPaging(req);

  const result = await getLogs({
    towID,
    paging,
    typeIds,
    from,
    to,
    userIds,
    companyId: getRqUser(req).company_id,
    metadataFilter,
  });

  res.status(200).json(result);
}
