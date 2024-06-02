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
  const { control, setValue, reset } = useFormContext<BotAppearance>()

  const { data: sources } = api.attachments.getById.useQuery(
    companyLogoAttachmentId,
    {
      enabled: companyLogoAttachmentId !== '',
    },
  )

  const { mutate: createBlobURL, error } =
    api.attachments.createBlobURL.useMutation({
      onSuccess: async (data) => {
        if (data) {
          companyLogoAttachmentId = data.attachmentId
          setValue('companyLogoAttachmentId', data.attachmentId, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      },
      onError: () => {
        setValue('botAvatarAttachmentId', '')
        setAvatar('')
        console.log(error)
      },
    })

  const [avatar, setAvatar] = useState(sources?.cloudPath ?? '')

  useEffect(() => {
    sources ? setAvatar(sources.cloudPath ?? '') : setAvatar('')
  }, [sources, reset])

  return (
    <Controller
      name="companyLogoAttachmentId"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Bot Branding Logo</FormLabel>
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
