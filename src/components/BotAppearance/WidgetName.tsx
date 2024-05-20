import {
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  FormLabel,
} from '@mochi-ui/core'
import { type BotAppearance } from './BotAppearance'
import { Controller, useFormContext } from 'react-hook-form'

export const WidgetName = () => {
  const { control } = useFormContext<BotAppearance>()

  return (
    <div className="space-y-4">
      <Controller
        name="widgetName"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Bot name on widget</FormLabel>
            <TextFieldRoot>
              <TextFieldInput {...field} />
            </TextFieldRoot>
            <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
          </FormControl>
        )}
      />
      <Controller
        name="widgetSubheading"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>Subheading</FormLabel>
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
