export function getFileExtension(fileName?: string): string {
  if (!fileName) {
    return ''
  }
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex !== -1) {
    return fileName.slice(dotIndex + 1).toLowerCase()
  }
  return ''
}
