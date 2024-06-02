/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  useToast,
} from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { SaveBar } from '../SaveBar'
import { ColorPicker } from '../common/ColorPicker'
import { FormSkeleton } from '../common/FormSkeleton'
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
  companyLogoAttachmentId: z.string(),
  botAvatarAttachmentId: z.string(),
  widgetName: z
    .string()
    .min(1, 'Required')
    .max(50, 'Max length is 50 characters.'),
  widgetSubheading: z.string().max(50, 'Max length is 50 characters.'),
  widgetPlaceholder: z.string().max(100, 'Max length is 100 characters.'),
  widgetWelcomeMsg: z.string().max(100, 'Max length is 100 characters.'),
  accentColour: z.string().max(7, 'Required'),
})

interface BotAppearanceProps {
  defaultValues: BotAppearance
  onSuccess?: () => Promise<any>
}

const BotAppearanceForm = ({
  defaultValues,
  onSuccess,
}: BotAppearanceProps) => {
  const id = useParams()?.id
  const { toast } = useToast()

  const {
    mutate: updateBotAppearance,
    error,
    isError,
    isPending,
  } = api.bot.updateBotAppearance.useMutation({
    onSuccess: async () => {
      toast({
        description: 'Update settings successfully',
        scheme: 'success',
      })
      await onSuccess?.()
    },
    onError: () => {
      toast({
        description: 'Failed to update settings',
        scheme: 'danger',
      })
      console.error(error)
    },
  })

  const form = useForm<BotAppearance>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
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
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} />
      <div className="min-h-screen max-w-[600px] space-y-8">
        <div className="max-w-[400px] space-y-8">
          <WidgetName />
          <BotCompanyLogo companyLogoAttachmentId={companyLogoAttachmentId} />
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
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
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
  )
}

export const BotAppearancePage = () => {
  const id = useParams()?.id
  const {
    data: sources,
    refetch: refetchBotAppearance,
    isPending,
  } = api.bot.getById.useQuery(id as string)

  const formDefaultValues = useMemo<BotAppearance | null>(() => {
    if (!sources) {
      return null
    }
    return {
      botId: id as string,
      companyLogoAttachmentId: sources.companyLogoAttachmentId ?? '',
      botAvatarAttachmentId: sources.botAvatarAttachmentId ?? '',
      widgetName: sources.widgetName ?? 'Dwarves Bot',
      widgetSubheading: sources.widgetSubheading ?? 'Our bot answers instantly',
      widgetPlaceholder: sources.widgetPlaceholder ?? 'Send a message...',
      widgetWelcomeMsg:
        sources.widgetWelcomeMsg ?? 'Hey there, how can I help you',
      accentColour: sources.accentColour ?? '#ffffff',
    }
  }, [sources])

  if (isPending || formDefaultValues === null) {
    return <FormSkeleton />
  }

  return (
    <BotAppearanceForm
      defaultValues={formDefaultValues}
      onSuccess={refetchBotAppearance}
    />
  )
}
