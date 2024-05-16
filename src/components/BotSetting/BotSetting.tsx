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
  usageLimitPerUser: z.string(),
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
    setValue,
    formState: { isSubmitting, isDirty },
  } = form

  const onSubmit = async (props: BotSettingData) => {
    const payload: BotSettingData = {
      botId: id as string,
      name: props.name,
      description: props.description,
      noSourceWarningMsg: props.noSourceWarningMsg,
      serverErrorMsg: props.serverErrorMsg,
      userLimitWarningMsg: props.userLimitWarningMsg,
      modelId: Number(props.modelId),
      usageLimitPerUser: Number(props.usageLimitPerUser),
      usageLimitPerUserType: Number(props.usageLimitPerUserType),
    }

    try {
      updateBotSettings(payload)
    } catch (error) {
      console.log(error)
    }

    await refetchBotSettings()
  }

  const resetData = useCallback(
    (data?: typeof sources) => {
      if (!data) return
      reset({
        botId: id as string,
        name: data.name!,
        description: data.description!,
        noSourceWarningMsg: data.noSourceWarningMsg!,
        serverErrorMsg: data.serverErrorMsg!,
        userLimitWarningMsg: data.userLimitWarningMsg!,
        modelId: Number(data.modelId),
        usageLimitPerUser: Number(data.usageLimitPerUser!),
        usageLimitPerUserType: Number(data.usageLimitPerUserType!),
      })
    },

    [reset],
  )

  useEffect(() => {
    if (sources && !isInitialData.current) {
      isInitialData.current = true
      setValue('name', sources.name!)
      setValue('description', sources.description!)
      setValue('noSourceWarningMsg', sources.noSourceWarningMsg!)
      setValue('serverErrorMsg', sources.serverErrorMsg!)
      setValue('userLimitWarningMsg', sources.userLimitWarningMsg!)
      setValue('usageLimitPerUser', Number(sources.usageLimitPerUser))
      setValue('modelId', Number(sources.modelId))
      setValue('usageLimitPerUserType', Number(sources.usageLimitPerUserType))
    }
  }, [sources])

  useEffect(() => {
    resetData(sources)
  }, [resetData, sources])

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
        open={isDirty && isInitialData.current}
        isLoading={isSubmitting}
        onConfirm={handleSubmit(onSubmit)}
        onCancel={() => reset()}
      />
    </FormProvider>
  )
}
