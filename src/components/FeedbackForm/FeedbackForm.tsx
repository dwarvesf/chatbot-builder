import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  useToast,
  Typography,
} from '@mochi-ui/core'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FeedbackTypeEnum } from '~/model/feedback'
import { api } from '~/utils/api'

export interface FeedbackForm {
  chatId: string
  notes: string
  feedbackType: FeedbackTypeEnum
}

const schema = z.object({
  chatId: z.string(),
  notes: z.string(),
  feedbackType: z.nativeEnum(FeedbackTypeEnum),
})

interface FeedbackFormProp {
  apiToken?: string
  chatId: string
  onSuccess: () => void
}

export const FeedbackForm = ({
  apiToken,
  chatId,
  onSuccess,
}: FeedbackFormProp) => {
  const { toast } = useToast()

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      chatId: chatId,
      feedbackType: FeedbackTypeEnum.Other,
      notes: '',
    },
  })

  const { mutate: createRating } = api.feedback.createRating.useMutation({
    onSuccess: async () => {
      toast({
        description: 'Create feedback successfully',
        scheme: 'success',
      })
      onSuccess()
    },
    onError: (error) => {
      toast({
        description: 'Failed to create feedback',
        scheme: 'danger',
      })
      console.error(error)
    },
  })

  const { handleSubmit } = form

  const radios = [
    {
      name: 'Too long',
      value: FeedbackTypeEnum.TooLong,
    },
    {
      name: 'Too short',
      value: FeedbackTypeEnum.TooShort,
    },
    {
      name: 'Out of date',
      value: FeedbackTypeEnum.OutOfDate,
    },
    {
      name: 'Inaccurate',
      value: FeedbackTypeEnum.Inaccurate,
    },
    {
      name: 'Harmful or Offensive',
      value: FeedbackTypeEnum.HarmfulOrOffensive,
    },
    {
      name: 'Not Helpful',
      value: FeedbackTypeEnum.NotHelpful,
    },
    {
      name: 'Other',
      value: FeedbackTypeEnum.Other,
    },
  ]

  const onSubmit = (props: FeedbackForm) => {
    if (!apiToken) {
      return
    }
    const payload: FeedbackForm = {
      ...props,
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      createRating({ ...payload, apiToken: apiToken })
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="feedbackType"
          render={({ field, fieldState }) => (
            <FormControl error={!!fieldState.error} hideHelperTextOnError>
              <ul className="flex flex-wrap space-x-2 space-y-2 items-baseline">
                {radios.map((item, idx) => (
                  <li key={idx}>
                    <label htmlFor={item.name} className="block relative">
                      <input
                        className="sr-only peer"
                        name="feedbackType"
                        type="radio"
                        id={item.name}
                        value={item.value}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value))
                        }}
                      />
                      <div className="w-fit p-2 cursor-pointer rounded-lg border bg-white shadow-sm  peer-checked:bg-gray-300">
                        <Typography level="p4" fontWeight="md" noWrap>
                          {item.name}
                        </Typography>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
            </FormControl>
          )}
        />

        <Controller
          name="notes"
          render={({ field, fieldState }) => (
            <FormControl error={!!fieldState.error} hideHelperTextOnError>
              <Typography level="h7" fontWeight="md">
                How can the response be improved?
              </Typography>
              <TextFieldRoot>
                <TextFieldInput
                  {...field}
                  placeholder="(Optional) Feel free to add specific details"
                />
              </TextFieldRoot>
              <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
            </FormControl>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  )
}
