import {
  FormControl,
  FormLabel,
  TextFieldInput,
  TextFieldRoot,
} from '@mochi-ui/core'
import { Controller, useFormContext } from 'react-hook-form'
import { type BotSettingData } from './BotSetting'

export const BotCaching = () => {
  const { control } = useFormContext<BotSettingData>()
  return (
    <div className="space-y-4 max-w-fit">
      <Controller
        name="cacheEmbeddingSecs"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>
              Embedding caching duration (seconds), 0 mean no caching
            </FormLabel>

            <TextFieldRoot>
              <TextFieldInput {...field} type="number" defaultValue={0} />
            </TextFieldRoot>
          </FormControl>
        )}
      />
    </div>
  )
}
