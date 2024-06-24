/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import {
  Avatar,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  IconButton,
  Tooltip,
  Typography,
} from '@mochi-ui/core'
import { SpinnerLine } from '@mochi-ui/icons'
import clsx from 'clsx'
import { api, type RouterOutputs } from '~/utils/api'
import { Like, DisLike } from '~/components/icons/svg'
import { FeedbackTypeEnum } from '~/model/feedback'

interface ChatDetailDrawerProps {
  onOpenChange: (open: boolean) => void
  isOpen: boolean
  source: RouterOutputs['thread']['getList']['threads']['0']
  apiToken: string
}

export const ChatDetailDrawer = (props: ChatDetailDrawerProps) => {
  const { onOpenChange, apiToken, isOpen, source } = props
  const { id } = source ?? {}

  return (
    <Drawer anchor="right" onOpenChange={onOpenChange} open={isOpen}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="p-6 w-[500px]" showCloseBtn>
          <SourceChunkList threadId={id} apiToken={apiToken} />
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

const SourceChunkList = ({
  threadId,
  apiToken,
}: {
  threadId: string
  apiToken: string
}) => {
  const { data, isPending } = api.chatRouter.getList.useQuery({
    apiToken: apiToken,
    threadId: threadId,
  })

  const { data: feedbackData } = api.feedback.getList.useQuery({
    apiToken: apiToken,
    threadId: threadId,
  })

  const feedbackArray = feedbackData?.chat_feedback.map((data) => ({
    chatId: data.chatId,
    typeId: data.typeId,
  }))

  const chatData = data?.chats ?? []

  const arrPositiveType = [
    FeedbackTypeEnum.Correct,
    FeedbackTypeEnum.EasyToUnderstand,
    FeedbackTypeEnum.Complete,
    FeedbackTypeEnum.OtherPositive,
  ]

  const arrNegativeType = [
    FeedbackTypeEnum.TooLong,
    FeedbackTypeEnum.TooShort,
    FeedbackTypeEnum.OutOfDate,
    FeedbackTypeEnum.Inaccurate,
    FeedbackTypeEnum.HarmfulOrOffensive,
    FeedbackTypeEnum.NotHelpful,
    FeedbackTypeEnum.OtherNegative,
  ]

  return (
    <>
      {isPending ? (
        <div className="py-6 flex justify-center">
          <SpinnerLine className="w-8 h-8 text-primary-plain-fg" />
        </div>
      ) : (
        <div className="space-y-4">
          <Typography level="p5" fontWeight="lg">
            Conversation ID: {threadId}
          </Typography>
          <div className="absolute inset-x-0 top-20 bottom-20 overflow-y-auto p-4 space-y-4">
            {chatData.map((item) => {
              const feedback = feedbackArray?.find(
                (feedback) => feedback.chatId === item.id,
              )

              return (
                <div key={item.id} className="space-y-2">
                  <ChatThread key={item.id} isRight={item.roleId}>
                    {item.msg}
                  </ChatThread>
                  <div>
                    {item.roleId !== 1 && (
                      <div>
                        <div className="flex flex-row ml-16 space-x-2 rounded-xl max-w-[80%]">
                          <Tooltip
                            className="z-[100]"
                            arrow="bottom-center"
                            content="User Like"
                          >
                            <IconButton
                              label="positive"
                              variant="link"
                              className={clsx('rounded-none hover:scale-110 ', {
                                'text-success-600': arrPositiveType.includes(
                                  feedback?.typeId ??
                                    FeedbackTypeEnum.OtherPositive,
                                ),
                              })}
                            >
                              <Like className="w-4 h-4 cursor-pointer" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            className="z-[100]"
                            arrow="bottom-center"
                            content="User DisLike"
                          >
                            <IconButton
                              label="negative"
                              variant="link"
                              className={clsx('rounded-none hover:scale-110 ', {
                                'text-red-600': arrNegativeType.includes(
                                  feedback?.typeId ??
                                    FeedbackTypeEnum.OtherNegative,
                                ),
                              })}
                            >
                              <DisLike className="w-4 h-4 cursor-pointer" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

const ChatThread = (props: { children: React.ReactNode; isRight?: number }) => {
  const { children, isRight } = props

  return (
    <div className={clsx('flex', { 'justify-end': isRight !== 1 })}>
      <div
        className={clsx('flex flex-1 gap-4', {
          'flex-row-reverse': isRight === 1,
        })}
      >
        <Avatar src={''} />
        <div
          className={clsx('p-4 rounded-xl max-w-[80%]', {
            'bg-secondary-100': isRight === 1,
            'bg-background-level2': isRight !== 1,
          })}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
