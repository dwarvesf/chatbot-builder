import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { truncate } from '@dwarvesf/react-utils'
import { Button, Card, Typography, useToast } from '@mochi-ui/core'
import { ArrowUpSquareSolid, DocumentOneSolid } from '@mochi-ui/icons'
import { upload } from '@vercel/blob/client'
import clsx from 'clsx'
import { useParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api } from '~/utils/api'
import { formatFileSize, getFileExtension } from '~/utils/file'

export function SitemapSourceFile() {
  const { id } = useParams()
  const botId = id as string

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const {
    mutate: createSource,
    isSuccess,
    isError,
    isPending,
    error,
  } = api.botSource.create.useMutation()

  const { refetch: refreshSourceTable } = api.botSource.getByBotId.useQuery({
    botId,
    limit: 100,
  })

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files?.[0]
      if (!file) {
        return
      }

      const extension = getFileExtension(file.name)
      if (!['txt'].includes(extension)) {
        toast({
          description: 'Invalid file format',
          scheme: 'danger',
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          description: 'File size exceeds 10MB limit',
          scheme: 'danger',
        })
        return
      }

      setSelectedFile(file)
    },
    [toast],
  )

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      ['text/plain']: ['.txt'],
    },
  })

  const handleSubmit = async () => {
    if (!selectedFile) {
      return
    }

    try {
      setIsUploading(true)
      const blob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload-file',
      })

      createSource({
        botId,
        url: blob.url,
        name: selectedFile.name,
        typeId: BotSourceTypeEnum.SitemapFile,
      })
    } catch (error) {
      toast({
        description: 'Failed to upload file',
        scheme: 'danger',
      })
    } finally {
      setIsUploading(false)
    }
  }

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Uploaded sitemap file successfully',
        scheme: 'success',
      })
      await refreshSourceTable()
    }
    if (isError) {
      toast({
        description: 'Failed to process sitemap file',
        scheme: 'danger',
      })
      console.error(error)
    }

    setSelectedFile(null)
  }, [isSuccess, isError, error])

  return (
    <Card className="mx-auto space-y-4 shadow-input">
      <div className="flex justify-between">
        <Typography level="p4">Upload file</Typography>
      </div>

      <>
        {selectedFile && (
          <div className="flex items-center justify-center">
            <div className="rounded-md flex items-center justify-center flex-col relative">
              <div className="absolute top-1 right-1"></div>
              <div className="flex flex-col space-y-2 items-center justify-center">
                <DocumentOneSolid className="text-primary-600 text-4xl" />
                <Typography level="p4">
                  {truncate(selectedFile.name, 40, true)}
                </Typography>
                <Typography level="p5">
                  {formatFileSize(selectedFile.size)}
                </Typography>
              </div>
              <Button
                onClick={() => setSelectedFile(null)}
                color="danger"
                variant="link"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
        {!selectedFile && (
          <div
            className={clsx(
              'h-40 px-5 rounded-lg border-dashed border-2 transition duration-150 flex items-center flex-col justify-center cursor-pointer',
              {
                'border-primary-500': isDragActive || !isDragReject,
                'border-danger-500 bg-danger-100': isDragReject,
              },
            )}
            {...getRootProps()}
          >
            <>
              <ArrowUpSquareSolid
                className={clsx('text-3xl', {
                  'text-primary-600': isDragActive || !isDragReject,
                  'text-danger-600 bg-danger-100': isDragReject,
                })}
              />
              <Typography level="p3" className="font-semibold text-center">
                {isDragActive && !isDragReject
                  ? 'Drop the files here ...'
                  : 'Click to upload or drag and drop your file here'}
              </Typography>
              <Typography color="textTertiary" level="p5">
                Up to 10MB. Support TXT. Each link is on a new line.
              </Typography>
            </>
          </div>
        )}
        <div className="flex justify-center">
          <Button
            loading={isUploading || isPending}
            className="w-40"
            onClick={handleSubmit}
            disabled={!selectedFile}
          >
            Upload and Train
          </Button>
        </div>
      </>
    </Card>
  )
}
