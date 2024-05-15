/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
} from '@mochi-ui/core'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

interface Props {
  isOpen?: boolean
  onSubmit: (links: string[]) => void
  onOpenChange: (open: boolean) => void
}

const urlSchema = z.string().url({ message: 'Invalid URL' })

const schema = z.object({
  links: z
    .string()
    .min(1, { message: 'Required' })
    .refine(
      (str) => {
        const links = str.split('\n')
        return links.every((link) => urlSchema.safeParse(link).success)
      },
      { message: 'Each line must be a valid URL' },
    ),
})

interface FormValues {
  links: string
}

export const BulkImportLinkModal = ({
  isOpen,
  onSubmit,
  onOpenChange,
}: Props) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { links: '' },
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        reset()
        // wait for the modal to close completely
      }, 400)
    }
  }, [isOpen, reset])

  async function onCreateBot({ links }: FormValues) {
    // make sure the links are unique
    onSubmit([...new Set(links.split('\n'))])
    onOpenChange(false)
  }

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="w-full max-w-md">
          <ModalTitle>Bulk import links</ModalTitle>
          <form onSubmit={handleSubmit(onCreateBot)}>
            <Controller
              name="links"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl error={!!fieldState.error} className="mt-5">
                  <FormLabel>Links</FormLabel>
                  <textarea
                    className="border p-2 appearance-none outline-none bg-transparent rounded shrink-0 py-2.5 caret-primary-outline-fg placeholder:text-text-disabled min-h-[100px] text-sm"
                    {...field}
                    placeholder={`https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3`}
                  />
                  <FormErrorMessage>
                    {fieldState.error?.message}
                  </FormErrorMessage>
                  <FormHelperText>
                    Please ensure that each link is on a new line
                  </FormHelperText>
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
                Import
              </Button>
            </div>
          </form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  )
}
