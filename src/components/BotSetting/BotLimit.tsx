import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormControl,
  FormErrorMessage,
  FormLabel,
  TextFieldInput,
  TextFieldRoot,
  Typography,
} from '@mochi-ui/core'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { type BotSettingData } from './BotSetting'
import { Controller, useFormContext } from 'react-hook-form'

interface LimitOptions {
  label: string
  value: UsageLimitTypeEnum
}

const options: LimitOptions[] = [
  { label: 'Per One Hour', value: UsageLimitTypeEnum.PerOneHour },
  { label: 'Per Four Hours', value: UsageLimitTypeEnum.PerFourHours },
  { label: 'Per Day', value: UsageLimitTypeEnum.PerDay },
  { label: 'Per Month', value: UsageLimitTypeEnum.PerMonth },
  { label: 'Per Week', value: UsageLimitTypeEnum.PerWeek },
]

export const BotLimit = () => {
  const { control } = useFormContext<BotSettingData>()

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-end space-x-4">
        <Controller
          name="usageLimitPerUser"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl error={!!fieldState.error} hideHelperTextOnError>
              <FormLabel>Usage limit per user</FormLabel>
              <TextFieldRoot>
                <TextFieldInput {...field} />
              </TextFieldRoot>
              <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
            </FormControl>
          )}
        />
        <Typography className="flex justify-center py-2 whitespace-nowrap	">
          message per users
        </Typography>
        <Controller
          name="usageLimitPerUserType"
          control={control}
          render={({ field }) => (
            <FormControl>
              <Select {...field} value={`${field.value}`}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="max-w-fit" align="end">
                  {options.map((props) => (
                    <SelectItem key={props.value} value={`${props.value}`}>
                      {props.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}
        />
      </div>

      <Controller
        name="userLimitWarningMsg"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} hideHelperTextOnError>
            <FormLabel>User limit warning</FormLabel>
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
