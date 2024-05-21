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

export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} Bytes`
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}
