import { Button, Typography, useToast } from '@mochi-ui/core'
import {
  ArrowUpSquareSolid,
  DocumentOneSolid,
  TrashBinLine,
} from '@mochi-ui/icons'
import { upload } from '@vercel/blob/client'
import { useParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { api } from '~/utils/api'
import { getFileExtension } from '~/utils/file'

interface Props {
  onSuccess: (url: string) => void | Promise<void>
}

const UploadFileModal = (props: Props) => {
  const { onSuccess } = props
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { id } = useParams()
  const { toast } = useToast()
  const botId = id as string

  const { refetch: refreshSourceTable } = api.botSource.getByBotId.useQuery({
    botId,
  })

  const onDrop = useCallback((files: File[]) => {
    const file = files?.[0]
    if (!file) {
      return
    }

    const extension = getFileExtension(file.name)
    if (!['pdf', 'txt', 'doc', 'docx'].includes(extension)) {
      console.log('Invalid file format')
      toast({
        description: 'Invalid file format',
        scheme: 'danger',
      })
      return
    }
    setSelectedFile(file)
  }, [])

  const { getRootProps, isDragActive } = useDropzone({ onDrop })

  const handleSubmit = async () => {
    if (!selectedFile) {
      return
    }

    try {
      setIsLoading(true)
      const blod = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload-file',
      })

      await onSuccess(blod.url)

      toast({
        description: 'Uploaded file successfully',
        scheme: 'success',
      })

      setSelectedFile(null)
    } catch (error) {
      toast({
        description: 'Failed to upload file',
        scheme: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {selectedFile && (
        <div className="flex items-center justify-center">
          {/* show trash TrashBinLine*/}

          <div className="w-48 h-52 rounded-md bg-primary-100 flex items-center justify-center flex-col space-y-4 relative">
            <div className="absolute top-1 right-1 bg-primary-100">
              <Button
                onClick={() => setSelectedFile(null)}
                variant={'ghost'}
                className="tw-bg-primary-100"
              >
                <TrashBinLine className="text-primary-600" />
              </Button>
            </div>
            <div className="w-20 h-20 flex items-center justify-center">
              <DocumentOneSolid className="text-primary-600 text-8xl" />
            </div>

            <Typography level="p3">{selectedFile.name}</Typography>
          </div>
        </div>
      )}
      {!selectedFile && (
        <div
          className="h-40 rounded-lg border-primary-500 border-dashed border-2 flex items-center flex-col justify-center cursor-pointer"
          {...getRootProps()}
        >
          <>
            <ArrowUpSquareSolid className="text-3xl text-primary-600" />
            <Typography level="p3" className="font-semibold">
              {isDragActive
                ? 'Drop the files here ...'
                : 'Click to upload or drag and drop your file here'}
            </Typography>
            <Typography color="textTertiary" level="p5">
              Up to 50MB. Support PDF, TXT, DOCS
            </Typography>
          </>
        </div>
      )}
      <div className="flex justify-center">
        <Button
          loading={isLoading}
          className="w-40"
          onClick={handleSubmit}
          disabled={!selectedFile}
        >
          Upload and Train
        </Button>
      </div>
    </>
  )
}

export default UploadFileModal
