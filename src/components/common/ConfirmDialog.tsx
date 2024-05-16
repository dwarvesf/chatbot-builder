import {
  Button,
  Modal,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  type ButtonProps,
} from '@mochi-ui/core'

interface Props {
  open?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void
  onError?: () => void
  title: string
  message: string
  isSubmitting?: boolean
  confirmButton?: {
    text: string
    color: ButtonProps['color']
  }
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  message,
  title,
  isSubmitting,
  confirmButton,
}: Props) => {
  return (
    <Modal {...{ open, onOpenChange }}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="w-full max-w-sm">
          <ModalTitle>{title}</ModalTitle>

          <div className="mt-5">
            <ModalDescription>{message}</ModalDescription>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <Button
              size="lg"
              color="neutral"
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              color={confirmButton?.color ?? 'primary'}
              onClick={onConfirm}
              size="lg"
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {confirmButton?.text ?? 'Confirm'}
            </Button>
          </div>
        </ModalContent>
      </ModalPortal>
    </Modal>
  )
}
