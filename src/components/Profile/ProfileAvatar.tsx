import { FormControl, FormErrorMessage, FormLabel } from '@mochi-ui/core'
import { Controller, useFormContext } from 'react-hook-form'
import { AvatarUploader } from '../AvatarUploader'
import { type ProfileForm } from './Profile'

export const ProfileAvatar = () => {
  const { control, setValue, watch } = useFormContext<ProfileForm>()
  const avatar = watch('image')

  return (
    <Controller
      name="image"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Avatar</FormLabel>
          <AvatarUploader
            description="Support jpeg, jpg, png format. Max 5MB"
            maxSizeInMB={5}
            fileTypes={['jpeg', 'jpg', 'png']}
            image={avatar}
            onSuccess={(blob) => {
              setValue('image', blob.url, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }}
            {...field}
          />
          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
        </FormControl>
      )}
    />
  )
}
