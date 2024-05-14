import { Typography } from '@mochi-ui/core'
import { BotDescription } from './BotDescription'
import { BotModel } from './BotModel'
import { BotMessages } from './BotMessages'
import { BotLimit } from './BotLimit'
import { FormProvider, useForm } from 'react-hook-form'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { BotModelEnum } from '~/model/bot-model'
import { Button } from '@mochi-ui/core'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams } from 'next/navigation'
import { api } from '~/utils/api'

export interface BotSettingData {
  botId: string
  name: string
  description: string
  modelId?: BotModelEnum | undefined
  messageNoSource?: string | undefined
  messageServerError?: string | undefined
  usageLimitPerUser?: number | undefined
  usageLimitPerUserType?: UsageLimitTypeEnum | undefined
  userLimitWarningMsg?: string | undefined
}

const schema = z.object({
  botId: z.string(),
  name: z.string().min(1, 'Required').max(50, 'Max length is 50 characters.'),
  description: z.string().max(500, 'Max length is 500 characters.'),
  modelId: z.nativeEnum(BotModelEnum),
  messageNoSource: z.string().max(100, 'Max length is 100 characters.'),
  messageServerError: z.string().max(100, 'Max length is 100 characters.'),
  usageLimitPerUser: z.string(),
  usageLimitPerUserType: z.nativeEnum(UsageLimitTypeEnum),
  userLimitWarningMsg: z.string().max(100, 'Max length is 100 characters.'),
})

export const BotSetting = () => {
  const id = useParams()?.id
  const { mutate: updateBotSettings } = api.bot.updateBotSettings.useMutation()

  const defaultValuesForm: BotSettingData = {
    botId: id as string,
    name: 'Dwarves Bot',
    description: '',
    modelId: BotModelEnum.GPT3,
    messageNoSource:
      'The bot still needs to be trained, so please add the data and train it.',
    messageServerError: 'Apologies, there seems to be a server error.',
    usageLimitPerUser: 1,
    usageLimitPerUserType: UsageLimitTypeEnum.PerDay,
    userLimitWarningMsg: `You've reached the message limit.`,
  }

  const form = useForm<BotSettingData>({
    defaultValues: defaultValuesForm,
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: typeof defaultValuesForm) => {
    const dataFormat: BotSettingData = {
      botId: id as string,
      name: data.name,
      description: data.description,
      modelId: Number(data.modelId),
      messageNoSource: data.messageNoSource,
      messageServerError: data.messageServerError,
      usageLimitPerUser: Number(data.usageLimitPerUser),
      usageLimitPerUserType: Number(data.usageLimitPerUserType),
      userLimitWarningMsg: data.userLimitWarningMsg,
    }

    try {
      updateBotSettings(dataFormat)
    } catch (error) {
      console.log(error)
    }
  }

  const { handleSubmit } = form
  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 sm:max-w-[600px]">
          <div className="space-y-4 sm:max-w-[300px]">
            <Typography level="h3" fontWeight="lg">
              General
            </Typography>
            <BotDescription />

            <Typography level="h3" fontWeight="lg">
              Model
            </Typography>
            <BotModel />
          </div>

          <Typography level="h3" fontWeight="lg">
            Messages
          </Typography>
          <BotMessages />

          <Typography level="h3" fontWeight="lg">
            Usage Limit
          </Typography>
          <BotLimit />
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </FormProvider>
  )
}
