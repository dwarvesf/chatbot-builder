import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  Typography,
  toast,
} from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api } from '~/utils/api'

const urlSchema = z
  .string()
  .min(1, { message: 'Required' })
  .url({ message: 'Invalid sitemap link' })
  .regex(/\.(xml|xml\.gz)$/, { message: 'Invalid sitemap link' })

const schema = z.object({
  url: urlSchema,
})

export function SitemapSourceLink() {
  const { id } = useParams()
  const botId = id as string

  const { handleSubmit, control, reset, formState } = useForm<{
    url: string
  }>({
    defaultValues: { url: '' },
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const { isDirty } = formState

  const {
    mutate: createBotSource,
    isPending,
    isSuccess,
    isError,
    error,
  } = api.botSource.create.useMutation()

  const { refetch: refreshSourceTable } = api.botSource.getByBotId.useQuery({
    botId,
  })

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Created source from sitemap successfully',
        scheme: 'success',
      })
      await refreshSourceTable()
      reset()
    }
    if (isError) {
      toast({
        description: 'Failed to import sitemap',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  return (
    <Card className="mx-auto space-y-4 shadow-input">
      <div className="flex justify-between">
        <Typography level="p4">Enter sitemap URL</Typography>
      </div>
      <div>
        <form
          onSubmit={handleSubmit(({ url }) => {
            const submitUrl = url.trim()
            createBotSource({
              botId,
              url: submitUrl,
              typeId: BotSourceTypeEnum.Sitemap,
            })
          })}
          className="space-y-3"
        >
          <Controller
            name="url"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl className="flex-1" error={!!fieldState.error}>
                <TextFieldRoot>
                  <TextFieldInput
                    {...field}
                    placeholder="https://example.com/sitemap.xml"
                  />
                </TextFieldRoot>
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />
          <div className="flex justify-center">
            <Button loading={isPending} disabled={!isDirty} className="w-40">
              Upload and Train
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
