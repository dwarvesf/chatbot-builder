import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { FormControl, FormErrorMessage, FormLabel } from '@mochi-ui/core'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { api } from '~/utils/api'
import { AvatarUploader } from '../AvatarUploader'
import { type BotAppearance } from './BotAppearance'

interface Props {
  companyLogoAttachmentId: string
}

export const BotCompanyLogo = ({ companyLogoAttachmentId }: Props) => {
  const { control, setValue } = useFormContext<BotAppearance>()
  const {
    mutate: createBlobURL,
    error,
    isSuccess,
    isError,
    data,
  } = api.attachments.createBlobURL.useMutation()

  const [id, setId] = useState(companyLogoAttachmentId ?? data?.attachmentId)

  const { data: sources, refetch: refetch } =
    api.attachments.getById.useQuery(id)

  const [avatar, setAvatar] = useState(sources?.cloudPath ?? '')

  useAsyncEffect(async () => {
    if (isSuccess) {
      setId(data?.attachmentId)
      await refetch()
    }
    if (isError) {
      console.error(error)
    }
  }, [isSuccess, isError, error])

  useEffect(() => {
    if (sources) {
      setAvatar(sources.cloudPath!)
      setValue('companyLogoAttachmentId', sources.id, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [sources])

  useEffect(() => {
    setId(companyLogoAttachmentId)
  }, [companyLogoAttachmentId])

  return (
    <Controller
      name="companyLogoAttachmentId"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Bot Branding Logo</FormLabel>
          <div>
            <AvatarUploader
              {...field}
              description="Support jpeg, jpg, png format. Max 5MB"
              maxSizeInMB={5}
              fileTypes={['jpeg', 'jpg', 'png']}
              image={avatar}
              onSuccess={(blob) => {
                createBlobURL({ cloudPath: blob.url })
              }}
              {...field}
            />
          </div>
          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
        </FormControl>
      )}
    />
  )
}
