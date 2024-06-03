/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, Typography, useToast } from '@mochi-ui/core'
import { SpinnerLine } from '@mochi-ui/icons'
import { BlobAccessError, type PutBlobResult } from '@vercel/blob'
import { upload } from '@vercel/blob/client'
import clsx from 'clsx'
import { useEffect, useId, useRef, useState } from 'react'

interface AvatarUploaderProps {
  onSuccess: (blob: PutBlobResult) => void
  fileTypes: string[]
  maxSizeInMB: number
  description: string
  image: string
}

export const AvatarUploader = (props: AvatarUploaderProps) => {
  const {
    onSuccess,
    image: avatarProp,
    fileTypes,
    maxSizeInMB,
    description,
  } = props
  const { toast } = useToast()
  const [avatar, setAvatar] = useState(avatarProp)
  const [isLoading, setIsLoading] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const id = useId()

  useEffect(() => {
    avatarProp ? setAvatar(avatarProp) : setAvatar('')
  }, [avatarProp])

  const validateFile = (file: File): string | null => {
    if (file.size > 1024 * 1024 * maxSizeInMB) {
      return `File size must be less than or equals to ${maxSizeInMB}MB`
    }

    const fileType = file.type.replace('image/', '')
    if (!fileTypes.includes(fileType)) {
      return `Only support file ${fileTypes.join(', ')}`
    }

    return null
  }

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      toast({ description: validationError, scheme: 'danger' })
      return
    }

    const newAvatar = URL.createObjectURL(file)
    setIsLoading(true)
    setAvatar(newAvatar)

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-file',
      })

      onSuccess(newBlob)
    } catch (error: any) {
      if (error instanceof BlobAccessError) {
        setAvatar('')
        toast({ description: 'Exceed file size limit', scheme: 'danger' })
      } else {
        setAvatar('')
        toast({ description: error?.message ?? '', scheme: 'danger' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background-surface border border-neutral-outline-border rounded-xl">
      <label
        htmlFor={id}
        className="flex w-full h-full py-2 px-3 cursor-pointer gap-4 items-center"
      >
        <div className="relative p-0 text-[0px]">
          <Avatar size="2xl" src={avatar} />
          <div
            className={clsx(
              'transition duration-200 opacity-0 absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full',
              { 'opacity-100': isLoading },
            )}
          >
            <SpinnerLine className="text-2xl text-white" />
          </div>
        </div>

        <Typography level="p4" fontWeight="md">
          {description}
        </Typography>
        <input
          id={id}
          className="hidden"
          ref={inputFileRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </label>
    </div>
  )
}
