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
