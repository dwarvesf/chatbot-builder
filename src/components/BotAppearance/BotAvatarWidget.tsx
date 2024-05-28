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
  const { control, setValue, reset } = useFormContext<BotAppearance>()

  const {
    mutate: createBlobURL,
    error,
    isSuccess,
    isError,
    data,
  } = api.attachments.createBlobURL.useMutation()

  const { data: sources, refetch: refetch } = api.attachments.getById.useQuery(
    botAvatarAttachmentId,
  )

  const [avatar, setAvatar] = useState(sources?.cloudPath ?? '')

  useEffect(() => {
    if (sources) {
      setAvatar(sources.cloudPath ?? '')
    } else {
      setAvatar('')
    }
  }, [sources, reset])

  useAsyncEffect(async () => {
    if (isSuccess) {
      if (data) {
        botAvatarAttachmentId = data.attachmentId
        setValue('botAvatarAttachmentId', data.attachmentId, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
      await refetch()
    }
    if (isError) {
      console.error(error)
    }
  }, [isSuccess, isError, error])

  return (
    <Controller
      name="botAvatarAttachmentId"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Bot Avatar Logo</FormLabel>
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
          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
        </FormControl>
      )}
    />
  )
}
