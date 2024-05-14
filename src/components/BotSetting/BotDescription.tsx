import {
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  FormLabel,
} from '@mochi-ui/core'
import { type BotSettingData } from './BotSetting'
import { Controller, useFormContext } from 'react-hook-form'

export const BotDescription = () => {
  const { control } = useFormContext<BotSettingData>()

  return (
    <div className="space-y-4">
      <Controller
        name="name"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error}>
            <FormLabel>Bot name</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} placeholder="Dwarves Bot" />
            </TextFieldRoot>
            <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
          </FormControl>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error}>
            <FormLabel>Bot description</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} />
            </TextFieldRoot>
          </FormControl>
        )}
      />
    </div>
  )
}
