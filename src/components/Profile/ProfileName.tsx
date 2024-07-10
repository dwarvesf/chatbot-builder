import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  TextFieldInput,
  TextFieldRoot,
} from '@mochi-ui/core'
import { Controller, useFormContext } from 'react-hook-form'
import { type ProfileForm } from './Profile'

export const ProfileName = () => {
  const { control } = useFormContext<ProfileForm>()

  return (
    <div className="space-y-4">
      <Controller
        name="firstName"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>First Name</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} />
            </TextFieldRoot>
            <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
          </FormControl>
        )}
      />
      <Controller
        name="lastName"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Last Name</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} />
            </TextFieldRoot>
            <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
          </FormControl>
        )}
      />
    </div>
  )
}
