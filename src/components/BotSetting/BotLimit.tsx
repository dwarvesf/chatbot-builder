import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextFieldInput,
  TextFieldRoot,
  Typography,
} from '@mochi-ui/core'
import { Controller, useFormContext } from 'react-hook-form'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { type BotSettingData } from './BotSetting'

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
  const { control, formState } = useFormContext<BotSettingData>()
  const { errors } = formState

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <Controller
            name="usageLimitPerUser"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl error={!!fieldState.error} hideHelperTextOnError>
                <FormLabel>Usage limit per user</FormLabel>
                <TextFieldRoot>
                  <TextFieldInput {...field} type="number" />
                </TextFieldRoot>
              </FormControl>
            )}
          />
          <div className="flex items-center space-x-4 mt-6">
            <Typography level="p4" className="flex flex-col gap-2">
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
                    <SelectContent className="max-w-fit h-[37.5]" align="end">
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
        </div>
        {errors.usageLimitPerUser ? (
          <Typography
            level="p7"
            className="text-xs tracking-tighter !text-danger-outline-fg"
          >
            {errors.usageLimitPerUser?.message}
          </Typography>
        ) : null}
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
