import { Buffer } from 'buffer'
import dayjs from 'dayjs'

export const isValidURL = (url: string) => {
  const urlRegex =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  return urlRegex.test(url)
}

type DatetimeFormat =
  | 'DD/MM/YYYY'
  | 'DD MMM'
  | 'DD MMM YYYY [at] h:mm A'
  | 'DD MMM YYYY'
  | 'h:mma'
  | 'h:mm a'
  | 'MMM D, YYYY'
  | 'dddd, MMMM D, YYYY'

export function formatDatetime(
  date?: dayjs.ConfigType,
  format: DatetimeFormat = 'DD/MM/YYYY',
) {
  if (!date) return ''

  return dayjs(date).format(format)
}

export function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export function isBase64(str: string) {
  const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/
  return base64Pattern.test(str)
}

export function isImageData(b64data: string): boolean {
  const imageSignatures: Record<string, string> = {
    '\xFF\xD8\xFF': 'jpg',
    '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A': 'png',
    '\x47\x49\x46\x38': 'gif',
    '\x52\x49\x46\x46': 'webp',
  }

  try {
    const header = Buffer.from(b64data, 'base64').subarray(0, 8) // Decode and get the first 8 bytes
    for (const [sig, format] of Object.entries(imageSignatures)) {
      if (header.indexOf(Buffer.from(sig, 'latin1')) === 0) {
        return true
      }
    }
    return false
  } catch (error) {
    return false
  }
}
