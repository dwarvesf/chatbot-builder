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
  Typography,
  useToast,
} from '@mochi-ui/core'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { isValidURL } from '~/utils/utils'

interface Props {
  botId: string
  typeId: number
  isOpen?: boolean
  onSucess?: () => void
  onError?: () => void
  onOpenChange: (open: boolean) => void
}

const schema = z.object({
  links: z
    .string()
    .min(1, { message: 'Required' })
    .refine(
      (value) => {
        const links = value.split('\n')
        return links.every((link) => link.length > 0 && isValidURL(link))
      },
      { message: 'Each valid link must be on one line' },
    ),
})

export const BulkImportLinkModal = ({
  botId,
  typeId,
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
    links: string
  }>({
    defaultValues: { links: '' },
    resolver: zodResolver(schema),
    mode: 'onChange',
  })
  const { toast } = useToast()
  const { mutate, error } = api.botSource.create.useMutation()

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        reset()
        // wait for the modal to close completely
      }, 400)
    }
  }, [isOpen, reset])

  async function onBulkImport(data: { links: string }) {
    try {
      mutate({
        botId: botId,
        typeId: typeId,
        url: data.links,
      })
      toast({
        description: 'Bulk import successfully',
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
        <ModalContent className="w-full max-w-xl">
          <ModalTitle>Bulk import links</ModalTitle>
          <form onSubmit={handleSubmit(onBulkImport)}>
            <Controller
              name="links"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl error={!!fieldState.error} className="mt-5">
                  <FormLabel>links</FormLabel>
                  <TextFieldRoot>
                    <TextFieldInput {...field} placeholder="<link>" />
                  </TextFieldRoot>
                  <FormErrorMessage>
                    {fieldState.error?.message}
                  </FormErrorMessage>
                </FormControl>
              )}
            />
            <Typography variant="body2" className="mt-3">
              Please ensure that each link is on one line
            </Typography>
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
