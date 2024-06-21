/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  FormControl,
  FormErrorMessage,
  TextFieldInput,
  TextFieldRoot,
  useToast,
  Typography,
} from '@mochi-ui/core'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FeedbackTypeEnum } from '~/model/feedback'
import { api } from '~/utils/api'
import { CloseLine } from '@mochi-ui/icons'

export interface FeedbackFormProps {
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
  isPositive: boolean
  onSuccess: () => void
}

export const FeedbackForm = ({
  apiToken,
  chatId,
  isPositive,
  onSuccess,
}: FeedbackFormProp) => {
  const { toast } = useToast()

  const form = useForm<FeedbackFormProps>({
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

  const radiosPositive = [
    { name: 'Correct', value: FeedbackTypeEnum.Correct },
    { name: 'Easy to understand', value: FeedbackTypeEnum.EasyToUnderstand },
    { name: 'Complete', value: FeedbackTypeEnum.Complete },
  ]

  const radiosNegative = [
    { name: 'Too long', value: FeedbackTypeEnum.TooLong },
    { name: 'Too short', value: FeedbackTypeEnum.TooShort },
    { name: 'Out of date', value: FeedbackTypeEnum.OutOfDate },
    { name: 'Inaccurate', value: FeedbackTypeEnum.Inaccurate },
    {
      name: 'Harmful or Offensive',
      value: FeedbackTypeEnum.HarmfulOrOffensive,
    },
    { name: 'Not Helpful', value: FeedbackTypeEnum.NotHelpful },
    { name: 'Other', value: FeedbackTypeEnum.Other },
  ]

  const onSubmit = (props: FeedbackFormProps) => {
    if (!apiToken) {
      return
    }
    const payload: FeedbackFormProps = { ...props }

    try {
      createRating({ ...payload, isLike: isPositive, apiToken: apiToken })
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
  }

  const radios = isPositive ? radiosPositive : radiosNegative

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
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <div className="w-fit p-2 cursor-pointer rounded-lg border bg-white shadow-sm peer-checked:bg-gray-300">
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

interface FeedbackFormWrapperProps {
  apiToken?: string
  chatId: string
  isPositive: boolean
  onSuccess: () => void
  handleClose: () => void
}

export const FeedbackFormWrapper = ({
  apiToken,
  chatId,
  isPositive,
  onSuccess,
  handleClose,
}: FeedbackFormWrapperProps) => {
  return (
    <div className="w-full flex flex-col ml-14 mt-4 p-4 space-y-2 rounded-xl max-w-[50%] bg-background-level2">
      <div className="w-full flex flex-row justify-between">
        <Typography level="h7" fontWeight="md">
          Why did you choose this rating? (optional)
        </Typography>
        <CloseLine className="w-5 h-5 cursor-pointer" onClick={handleClose} />
      </div>
      <FeedbackForm
        apiToken={apiToken}
        chatId={chatId}
        onSuccess={onSuccess}
        isPositive={isPositive}
      />
    </div>
  )
}
