import { Typography, useToast } from '@mochi-ui/core'
import { PlusLine } from '@mochi-ui/icons'
import { useRef, useState } from 'react'

type FileInputProps = {
  format?: string[]
  maxSize?: number
  isMultiple?: boolean
  onFilesSelect: (files: FileList) => void
}

const FileInput: React.FC<FileInputProps> = ({
  format = ['.csv'],
  maxSize = 100000000,
  isMultiple,
  onFilesSelect,
}: FileInputProps) => {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileList | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // process selected files
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      for (const file of selectedFiles) {
        if (file.size > maxSize) {
          toast({
            description: `File "${file.name}" too big, please select file size not over ${maxSize / 1000} KB.`,
            scheme: 'danger',
          })
          return
        }
      }
      setFiles(selectedFiles)
      onFilesSelect(selectedFiles)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles) {
      for (const file of droppedFiles) {
        if (file.size > maxSize) {
           toast({
             description: `File "${file.name}" too big, please select file size not over ${maxSize / 1000} KB.`,
             scheme: 'danger',
           })
          return
        }
      }
      setFiles(droppedFiles)
      onFilesSelect(droppedFiles)
    }
  }
  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className="bg-white h-[200px] rounded-md border-dashed border-blue-400 border-2 items-center justify-center"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleContainerClick}
    >
      <div className="flex flex-col justify-center items-center p-4">
        <PlusLine height={20} width={20} />
        <Typography className="text-xl text-gray-900">
          Click to upload a file or drag and drop it here
        </Typography>
        <div className="text-sm text-gray-700">Up to 100MB in size .CSV</div>
      </div>
      <input
        className="hidden"
        type="file"
        max={maxSize}
        accept={format?.join(',') || '*'}
        multiple={isMultiple}
        onChange={handleFileSelect}
        ref={fileInputRef}
      />
    </div>
  )
}

export default FileInput
