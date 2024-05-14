import {
  FormControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormLabel,
} from '@mochi-ui/core'
import { Controller, useFormContext } from 'react-hook-form'
import { api } from '~/utils/api'
import { type BotSettingData } from './BotSetting'

export const BotModel = () => {
  const { control } = useFormContext<BotSettingData>()
  const { data: sources } = api.botAIModelRouter.getList.useQuery()
  return (
    <div className="space-y-4 max-w-fit">
      <Controller
        name="modelId"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>AI Model</FormLabel>

            <Select>
              <SelectTrigger>
                <SelectValue
                  placeholder={sources ? sources[0]?.name : 'Select'}
                />
              </SelectTrigger>
              <SelectContent {...field}>
                {sources?.map(({ id, name }) => (
                  <SelectItem key={id} value={`${id}`}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        )}
      />
    </div>
  )
}
