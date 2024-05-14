import {
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  FormLabel,
} from '@mochi-ui/core'
import { type BotSettingData } from './BotSetting'
import { Controller, useFormContext } from 'react-hook-form'

export const BotMessages = () => {
  const { control } = useFormContext<BotSettingData>()

  return (
    <div className="space-y-4">
      <Controller
        name="messageNoSource"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Message show when no Source is added</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} />
            </TextFieldRoot>
            <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
          </FormControl>
        )}
      />
      <Controller
        name="messageServerError"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Message show when no Source is added</FormLabel>
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
