/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  TextFieldInput,
  TextFieldRoot,
  useToast,
} from '@mochi-ui/core'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'

interface Props {
  isOpen?: boolean
  onSucess?: () => void
  onError?: () => void
  onOpenChange: (open: boolean) => void
}

const schema = z.object({
  botName: z.string().min(1, { message: 'Required' }),
})

export const CreateBotModal = ({
  isOpen,
  onSucess,
  onOpenChange,
  onError,
}: Props) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{
    botName: string
  }>({
    defaultValues: { botName: '' },
    resolver: zodResolver(schema),
    mode: 'onChange',
  })
  const { toast } = useToast()
  const { mutate, error } = api.bot.create.useMutation()

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        reset()
        // wait for the modal to close completely
      }, 400)
    }
  }, [isOpen, reset])

  // console.log({ error })

  async function onCreateBot(data: { botName: string }) {
    try {
      mutate({ name: data.botName })
      toast({
        description: 'Created Bot successfully',
        scheme: 'success',
      })
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
    onOpenChange(false)
  }

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="w-full max-w-sm">
          <ModalTitle>Create new Bot</ModalTitle>
          <form onSubmit={handleSubmit(onCreateBot)}>
            <Controller
              name="botName"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl error={!!fieldState.error} className="mt-5">
                  <FormLabel>Bot name</FormLabel>
                  <TextFieldRoot>
                    <TextFieldInput {...field} placeholder="<Bot name>" />
                  </TextFieldRoot>
                  <FormErrorMessage>
                    {fieldState.error?.message}
                  </FormErrorMessage>
                </FormControl>
              )}
            />
            <div className="grid grid-cols-2 gap-3 mt-8">
              <Button
                color="neutral"
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!Object.keys(errors).length}
                loading={isSubmitting}
              >
                Create
              </Button>
            </div>
          </form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  )
}
