import { FormControl, FormErrorMessage, FormLabel } from '@mochi-ui/core'
import { Controller, useFormContext } from 'react-hook-form'
import { AvatarUploader } from '../AvatarUploader'
import { type Profile } from './Profile'

export const ProfileAvatar = () => {
  const { control, setValue, watch } = useFormContext<Profile>()
  const avatar = watch('image')

  return (
    <Controller
      name="image"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Avatar</FormLabel>
          <AvatarUploader
            avatar={avatar}
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
