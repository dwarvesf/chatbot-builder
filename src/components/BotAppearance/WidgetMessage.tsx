import {
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  FormLabel,
} from '@mochi-ui/core'
import { type BotAppearance } from './BotAppearance'
import { Controller, useFormContext } from 'react-hook-form'

export const WidgetMessage = () => {
  const { control } = useFormContext<BotAppearance>()

  return (
    <div className="space-y-4">
      <Controller
        name="widgetPlaceholder"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Input placeholder</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} />
            </TextFieldRoot>
            <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
          </FormControl>
        )}
      />
      <Controller
        name="widgetWelcomeMsg"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Welcome message</FormLabel>
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
