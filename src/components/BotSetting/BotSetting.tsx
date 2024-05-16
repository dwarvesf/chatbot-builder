import { zodResolver } from '@hookform/resolvers/zod'
import { Typography } from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { BotModelEnum } from '~/model/bot-model'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { api } from '~/utils/api'
import { BotDescription } from './BotDescription'
import { BotLimit } from './BotLimit'
import { BotMessages } from './BotMessages'
import { BotModel } from './BotModel'
import { SaveBar } from '../SaveBar'
import { useCallback, useEffect, useRef } from 'react'

export interface BotSettingData {
  botId: string
  name: string
  description: string
  noSourceWarningMsg: string
  serverErrorMsg: string
  userLimitWarningMsg: string
  modelId: BotModelEnum
  usageLimitPerUser: number
  usageLimitPerUserType: UsageLimitTypeEnum
}

const schema = z.object({
  botId: z.string(),
  name: z.string().min(1, 'Required').max(50, 'Max length is 50 characters.'),
  description: z.string().max(500, 'Max length is 500 characters.').optional(),
  noSourceWarningMsg: z.string().max(100, 'Max length is 100 characters.'),
  serverErrorMsg: z.string().max(100, 'Max length is 100 characters.'),
  userLimitWarningMsg: z.string().max(100, 'Max length is 100 characters.'),
  modelId: z.nativeEnum(BotModelEnum),
  usageLimitPerUser: z.number(),
  usageLimitPerUserType: z.nativeEnum(UsageLimitTypeEnum),
})

export const BotSetting = () => {
  const id = useParams()?.id
  const isInitialData = useRef(false)

  const { mutate: updateBotSettings } = api.bot.updateBotSettings.useMutation()

  const { data: sources, refetch: refetchBotSettings } =
    api.bot.getById.useQuery(id as string)

  const form = useForm<BotSettingData>({
    resolver: zodResolver(schema),
    mode: 'all',
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = form

  const resetData = useCallback(
    (data?: BotSettingData) => {
      if (!data) return
      reset({
        ...data,
      })
    },

    [reset],
  )

  useEffect(() => {
    if (sources && !isInitialData.current) {
      isInitialData.current = true
      reset({
        botId: id as string,
        name: sources.name!,
        description: sources.description!,
        noSourceWarningMsg: sources.noSourceWarningMsg!,
        serverErrorMsg: sources.serverErrorMsg!,
        userLimitWarningMsg: sources.userLimitWarningMsg!,
        modelId: Number(sources.modelId),
        usageLimitPerUser: Number(sources.usageLimitPerUser!),
        usageLimitPerUserType: Number(sources.usageLimitPerUserType!),
      })
    }
  }, [sources])

  const onSubmit = async (props: BotSettingData) => {
    const payload: BotSettingData = {
      botId: id as string,
      name: props.name,
      description: props.description,
      noSourceWarningMsg: props.noSourceWarningMsg,
      serverErrorMsg: props.serverErrorMsg,
      userLimitWarningMsg: props.userLimitWarningMsg,
      modelId: props.modelId,
      usageLimitPerUser: props.usageLimitPerUser,
      usageLimitPerUserType: props.usageLimitPerUserType,
    }

    try {
      updateBotSettings(payload)
    } catch (error) {
      console.log(error)
    }
    resetData(payload)
    await refetchBotSettings()
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} />
      <div className="space-y-4 sm:max-w-[600px] min-h-screen">
        <div className="space-y-4 sm:max-w-[300px]">
          <Typography level="h6" fontWeight="lg">
            General
          </Typography>
          <BotDescription />

          <Typography level="h6" fontWeight="lg">
            Model
          </Typography>
          <BotModel />
        </div>

        <Typography level="h6" fontWeight="lg">
          Messages
        </Typography>
        <BotMessages />

        <Typography level="h6" fontWeight="lg">
          Usage Limit
        </Typography>
        <BotLimit />
      </div>
      <SaveBar
        open={isDirty}
        isLoading={isSubmitting}
        onConfirm={handleSubmit(onSubmit)}
        onCancel={() => reset()}
      />
    </FormProvider>
  )
}
