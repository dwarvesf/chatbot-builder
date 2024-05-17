import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { WidgetName } from './WidgetName'
import { WidgetMessage } from './WidgetMessage'
import { useCallback, useEffect, useRef } from 'react'

export interface BotAppearance {
  botId: string
  widgetName: string
  widgetSubheading: string
  widgetPlaceholder: string
  widgetWelcomeMsg: string
}

const schema = z.object({
  botId: z.string(),
  widgetName: z
    .string()
    .min(1, 'Required')
    .max(50, 'Max length is 50 characters.'),
  widgetSubheading: z.string().max(50, 'Max length is 50 characters.'),
  widgetPlaceholder: z.string().max(100, 'Max length is 100 characters.'),
  widgetWelcomeMsg: z.string().max(100, 'Max length is 100 characters.'),
})

export const BotAppearancePage = () => {
  const id = useParams()?.id
  const isInitialData = useRef(false)

  const { data: sources, refetch: refetchAppearance } =
    api.bot.getById.useQuery(id as string)

  const form = useForm<BotAppearance>({
    resolver: zodResolver(schema),
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = form

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
        widgetName: sources.widgetName!,
        widgetSubheading: sources.widgetSubheading!,
        widgetPlaceholder: sources.widgetPlaceholder!,
        widgetWelcomeMsg: sources.widgetWelcomeMsg!,
      })
    }
  }, [sources])

  const onSubmit = async (props: BotAppearance) => {
    const payload: BotAppearance = {
      botId: id as string,
      widgetName: props.widgetName,
      widgetSubheading: props.widgetSubheading,
      widgetPlaceholder: props.widgetPlaceholder,
      widgetWelcomeMsg: props.widgetWelcomeMsg,
    }
    resetData(payload)
  }
  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} />
      <div className="min-h-screen max-w-[600px] space-y-8">
        <div className="max-w-[400px] space-y-8">
          <WidgetName />
        </div>

        <WidgetMessage />
      </div>
    </FormProvider>
  )
}
