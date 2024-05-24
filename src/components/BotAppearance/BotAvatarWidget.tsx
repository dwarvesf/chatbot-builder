import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { FormControl, FormErrorMessage, FormLabel } from '@mochi-ui/core'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { api } from '~/utils/api'
import { AvatarUploader } from '../AvatarUploader'
import { type BotAppearance } from './BotAppearance'

interface Props {
  botAvatarAttachmentId: string
}

export const BotAvatarWidget = ({ botAvatarAttachmentId }: Props) => {
  const { control, setValue } = useFormContext<BotAppearance>()

  const {
    mutate: createBlobURL,
    error,
    isSuccess,
    isError,
    data,
  } = api.attachments.createBlobURL.useMutation()

  const [id, setId] = useState(botAvatarAttachmentId ?? data?.attachmentId)

  const { data: sources } = api.attachments.getById.useQuery(id)

  const [avatar, setAvatar] = useState(sources?.cloudPath ?? '')

  useAsyncEffect(async () => {
    if (isSuccess) {
      setId(data?.attachmentId)
    }
    if (isError) {
      console.error(error)
    }
  }, [isSuccess, isError, error])

  useEffect(() => {
    if (sources) {
      setAvatar(sources.cloudPath!)
      setValue('botAvatarAttachmentId', sources.id, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [sources])

  useEffect(() => {
    setId(botAvatarAttachmentId)
  }, [botAvatarAttachmentId])

  return (
    <Controller
      name="botAvatarAttachmentId"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Bot Avatar Logo</FormLabel>
          <div>
            <AvatarUploader
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
