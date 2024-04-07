import { Request } from 'express';

export function getRqPaging(req: Request, defaultLimit = 100, maxLimit = 1000) {
  const { offset = 0, limit = defaultLimit } = req.query;
  return {
    offset: Number(offset),
    limit: Math.min(Number(limit), maxLimit),
  };
}
