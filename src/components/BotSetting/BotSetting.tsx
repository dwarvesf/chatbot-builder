/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { Typography, useToast } from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { BotModelEnum } from '~/model/bot-model'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { api } from '~/utils/api'
import { SaveBar } from '../SaveBar'
import { FormSkeleton } from '../common/FormSkeleton'
import { BotDescription } from './BotDescription'
import { BotLimit } from './BotLimit'
import { BotMessages } from './BotMessages'
import { BotModel } from './BotModel'

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
  description: z.string().max(500, 'Max length is 500 characters.'),
  noSourceWarningMsg: z.string().max(100, 'Max length is 100 characters.'),
  serverErrorMsg: z.string().max(100, 'Max length is 100 characters.'),
  userLimitWarningMsg: z.string().max(100, 'Max length is 100 characters.'),
  modelId: z.nativeEnum(BotModelEnum),
  usageLimitPerUser: z.coerce.number(),
  usageLimitPerUserType: z.nativeEnum(UsageLimitTypeEnum),
})

interface BotSettingFormProps {
  defaultValues: BotSettingData
  onSuccess?: () => Promise<any>
}

const BotSettingForm = ({ defaultValues, onSuccess }: BotSettingFormProps) => {
  const id = useParams()?.id
  const { toast } = useToast()

  const {
    mutate: updateBotSettings,
    error,
    isSuccess,
    isError,
    isPending,
  } = api.bot.updateBotSettings.useMutation()

  const form = useForm<BotSettingData>({
    resolver: zodResolver(schema),
    mode: 'all',
    defaultValues,
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

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Update settings successfully',
        scheme: 'success',
      })
      await onSuccess?.()
    }
    if (isError) {
      toast({
        description: 'Failed to update settings',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  const onSubmit = async (props: BotSettingData) => {
    const payload: BotSettingData = {
      ...props,
      botId: id as string,
    }

    try {
      updateBotSettings(payload)
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
    resetData(payload)
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
        open={isDirty || isPending || isError}
        isLoading={isSubmitting || isPending}
        onConfirm={handleSubmit(onSubmit)}
        onCancel={() => reset()}
      />
    </FormProvider>
  )
}

export const BotSetting = () => {
  const id = useParams()?.id
  const {
    data: sources,
    refetch: refetchBotSettings,
    isPending,
  } = api.bot.getById.useQuery(id as string)

  const formDefaultValues = useMemo<BotSettingData | null>(() => {
    if (!sources) {
      return null
    }

    return {
      botId: id as string,
      name: sources.name ?? 'Dwarves Bot',
      description: sources.description ?? '',
      noSourceWarningMsg:
        sources.noSourceWarningMsg ??
        'The bot still needs to be trained, so please add the data and train it.',
      serverErrorMsg:
        sources.serverErrorMsg ??
        'Apologies, there seems to be a server error.',
      userLimitWarningMsg:
        sources.userLimitWarningMsg ?? "You've reached the message limit.",
      modelId: sources.modelId ?? BotModelEnum.GPT3,
      usageLimitPerUser: sources.usageLimitPerUser ?? 50,
      usageLimitPerUserType:
        sources.usageLimitPerUserType ?? UsageLimitTypeEnum.PerDay,
    }
  }, [id, sources])

  if (isPending || formDefaultValues === null) {
    return <FormSkeleton />
  }

  return (
    <BotSettingForm
      defaultValues={formDefaultValues}
      onSuccess={refetchBotSettings}
    />
  )
}
