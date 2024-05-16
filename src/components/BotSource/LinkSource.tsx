import { useAsyncEffect, useDisclosure } from '@dwarvesf/react-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  FormControl,
  FormErrorMessage,
  IconButton,
  TextFieldInput,
  TextFieldRoot,
  Typography,
  toast,
} from '@mochi-ui/core'
import { TrashBinLine } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { BulkImportLinkModal } from './BulkImportLinkModal'

const urlSchema = z
  .string()
  .min(1, { message: 'Required' })
  .url({ message: 'Invalid URL' })

const schema = z.object({
  url: urlSchema,
})

const linksSchema = z.object({
  links: z.array(urlSchema),
})

interface LinksFormValues {
  links: string[]
}

export function LinkSource() {
  const { id } = useParams()
  const botId = id as string

  const { isOpen, onOpenChange, onOpen } = useDisclosure()
  const { handleSubmit, control, reset } = useForm<{
    url: string
  }>({
    defaultValues: { url: '' },
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const {
    control: linksControl,
    getValues,
    formState: { errors, isDirty },
  } = useForm<LinksFormValues>({
    defaultValues: { links: [] },
    resolver: zodResolver(linksSchema),
  })

  const { fields, remove, append } = useFieldArray({
    control: linksControl,
    // @ts-expect-error - TS doesn't like the name property
    name: 'links',
  })

  const {
    mutate: createBotSource,
    isPending,
    isSuccess,
    isError,
    error,
  } = api.botSource.createBulk.useMutation()

  const { refetch: refreshSourceTable } = api.botSource.getByBotId.useQuery({
    botId,
  })

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Created source from links successfully',
        scheme: 'success',
      })
      await refreshSourceTable()
    }
    if (isError) {
      toast({
        description: 'Failed to import links',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  const submitBotSource = async () => {
    const urls = [...new Set(getValues().links)]
    if (urls.length > 0) {
      createBotSource({ botId, urls })
    }
  }

  return (
    <Card className="max-w-[600px] mx-auto space-y-4 shadow-input">
      <div className="flex justify-between">
        <Typography>Enter a website link</Typography>
        <Button size="sm" variant="soft" onClick={onOpen}>
          Bulk import
        </Button>
        <BulkImportLinkModal
          onSubmit={(links) => {
            append(links)
          }}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      </div>
      <div>
        <form className="space-y-2 mb-5">
          {fields.map((field, index) => (
            <Controller
              key={field.id}
              name={`links.${index}`}
              control={linksControl}
              render={({ field }) => (
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <TextFieldInput
                      className="text-text-primary"
                      disabled
                      value={field.value}
                    />
                  </div>
                  <IconButton
                    onClick={(e) => {
                      e.preventDefault()
                      remove(index)
                    }}
                    size="lg"
                    label="remove"
                    variant="ghost"
                    color="danger"
                  >
                    <TrashBinLine />
                  </IconButton>
                </div>
              )}
            />
          ))}
        </form>
        <form
          onSubmit={handleSubmit(({ url }) => {
            const submitUrl = url.trim()
            if (getValues().links.includes(submitUrl)) {
              toast({ scheme: 'danger', description: 'URL already exists' })
              return
            }
            append(submitUrl)
            reset()
          })}
          className="flex items-start space-x-2"
        >
          <Controller
            name="url"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl className="flex-1" error={!!fieldState.error}>
                <TextFieldRoot>
                  <TextFieldInput
                    {...field}
                    placeholder="Enter a website URL"
                  />
                </TextFieldRoot>
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />
          <Button type="submit" variant="soft" color="neutral" className="w-20">
            Add
          </Button>
        </form>
      </div>
      <div className="flex justify-center">
        <Button
          onClick={submitBotSource}
          disabled={!errors || !isDirty}
          loading={isPending}
        >
          Upload and train
        </Button>
      </div>
    </Card>
  )
}
