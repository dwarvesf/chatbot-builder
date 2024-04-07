import { isNumberString } from 'class-validator';

export function dateFromStr(timestamp: string): Date | null {
  if (timestamp) {
    if (isNumberString(timestamp)) {
      // From unix seconds
      return new Date(Number(timestamp) * 1e3);
    } else {
      return new Date(timestamp);
    }
  }

  return null;
}
