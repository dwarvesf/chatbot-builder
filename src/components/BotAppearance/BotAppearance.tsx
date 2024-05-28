/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Skeleton,
  useToast,
} from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { ColorPicker } from '../common/ColorPicker'
import { SaveBar } from '../SaveBar'
import { BotAvatarWidget } from './BotAvatarWidget'
import { BotCompanyLogo } from './BotCompanyLogo'
import { WidgetMessage } from './WidgetMessage'
import { WidgetName } from './WidgetName'

export interface BotAppearance {
  botId: string
  companyLogoAttachmentId: string
  botAvatarAttachmentId: string
  widgetName: string
  widgetSubheading: string
  widgetPlaceholder: string
  widgetWelcomeMsg: string
  accentColour: string
}

const schema = z.object({
  botId: z.string(),
  companyLogoAttachmentId: z.string().nullable(),
  botAvatarAttachmentId: z.string().nullable(),
  widgetName: z
    .string()
    .min(1, 'Required')
    .max(50, 'Max length is 50 characters.'),
  widgetSubheading: z.string().max(50, 'Max length is 50 characters.'),
  widgetPlaceholder: z.string().max(100, 'Max length is 100 characters.'),
  widgetWelcomeMsg: z.string().max(100, 'Max length is 100 characters.'),
  accentColour: z.string().max(7, 'Required'),
})

export const BotAppearancePage = () => {
  const id = useParams()?.id
  const isInitialData = useRef(false)
  const { toast } = useToast()
  const [isFetchingData, setIsFetchingData] = useState(false)

  const {
    mutate: updateBotAppearance,
    error,
    isSuccess,
    isError,
    isPending,
  } = api.bot.updateBotAppearance.useMutation()

  const { data: sources, refetch: refetchBotAppearance } =
    api.bot.getById.useQuery(id as string)

  const form = useForm<BotAppearance>({
    resolver: zodResolver(schema),
  })

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = form

  const color = watch('accentColour')
  const companyLogoAttachmentId = watch('companyLogoAttachmentId')
  const botAvatarAttachmentId = watch('botAvatarAttachmentId')

  const resetData = useCallback(
    (data?: BotAppearance) => {
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
        companyLogoAttachmentId: sources.companyLogoAttachmentId ?? '',
        botAvatarAttachmentId: sources.botAvatarAttachmentId ?? '',
        widgetName: sources.widgetName ?? 'Dwarves Bot',
        widgetSubheading:
          sources.widgetSubheading ?? 'Our bot answers instantly',
        widgetPlaceholder: sources.widgetPlaceholder ?? 'Send a message...',
        widgetWelcomeMsg:
          sources.widgetWelcomeMsg ?? 'Hey there, how can I help you',
        accentColour: sources.accentColour ?? '#ffffff',
      })
      setIsFetchingData(true)
    }
  }, [sources])

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Update settings successfully',
        scheme: 'success',
      })
      await refetchBotAppearance()
    }
    if (isError) {
      toast({
        description: 'Failed to update settings',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  const onSubmit = (props: BotAppearance) => {
    const payload: BotAppearance = {
      ...props,
      botId: id as string,
    }
    try {
      updateBotAppearance(payload)
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
    resetData(payload)
  }

  return (
    <div>
      {isFetchingData ? (
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} />
          <div className="min-h-screen max-w-[600px] space-y-8">
            <div className="max-w-[400px] space-y-8">
              <WidgetName />
              <BotCompanyLogo
                companyLogoAttachmentId={companyLogoAttachmentId}
              />
              <BotAvatarWidget botAvatarAttachmentId={botAvatarAttachmentId} />
              <Controller
                name="accentColour"
                render={({ fieldState }) => (
                  <FormControl error={!!fieldState.error} hideHelperTextOnError>
                    <FormLabel>Color</FormLabel>
                    <ColorPicker
                      defaultColor={color}
                      onChange={(color) =>
                        setValue('accentColour', color, { shouldDirty: true })
                      }
                    />
                    <FormErrorMessage>
                      {fieldState.error?.message}
                    </FormErrorMessage>
                  </FormControl>
                )}
              />
            </div>

            <WidgetMessage />

            <SaveBar
              open={isDirty || isPending || isError}
              isLoading={isSubmitting || isPending}
              onConfirm={handleSubmit(onSubmit)}
              onCancel={() => reset()}
            />
          </div>
        </FormProvider>
      ) : (
        <div className="min-h-screen max-w-[400px] space-y-8 animate-pulse">
          <div className="flex flex-col w-full relative items-stretch overflow-hidden rounded gap-12">
            <div className="flex flex-col w-full gap-4">
              <Skeleton className="w-2/5 h-4 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
            </div>

            <div className="flex flex-col w-full gap-4">
              <Skeleton className="w-2/5 h-4 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
            </div>
          </div>

          <div className="flex flex-row w-full relative items-stretch overflow-hidden rounded gap-4">
            <div className="flex items-center gap-3 w-full">
              <div>
                <Skeleton className="flex w-[64px] h-[64px] rounded-full" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <Skeleton className="w-3/5 h-4 rounded-lg" />
                <Skeleton className="w-4/5 h-4 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="flex flex-row w-full relative items-stretch overflow-hidden rounded gap-4">
            <div className="flex items-center gap-3 w-full">
              <div>
                <Skeleton className="flex w-[64px] h-[64px] rounded-full" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <Skeleton className="w-3/5 h-4 rounded-lg" />
                <Skeleton className="w-4/5 h-4 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-4">
            <Skeleton className="w-2/5 h-4 rounded-lg" />
            <Skeleton className="w-full h-4 rounded-lg" />
          </div>

          <div className="flex flex-col w-full relative items-stretch overflow-hidden rounded gap-12">
            <div className="flex flex-col w-full gap-4">
              <Skeleton className="w-2/5 h-4 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
            </div>

            <div className="flex flex-col w-full gap-4">
              <Skeleton className="w-2/5 h-4 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
