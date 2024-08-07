/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  Avatar,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  IconButton,
  Tooltip,
  Typography,
  ScrollArea,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  ScrollAreaViewport,
  Badge,
} from '@mochi-ui/core'
import { SpinnerLine } from '@mochi-ui/icons'
import clsx from 'clsx'
import { api, type RouterOutputs } from '~/utils/api'
import { Like, DisLike } from '~/components/icons/svg'
import { FeedbackTypeEnum } from '~/model/feedback'
import { useEffect, useRef } from 'react'

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
        <DrawerContent className="p-6 w-[600px]" showCloseBtn>
          <Typography level="h8" fontWeight="lg">
            Conversation ID: {id}
          </Typography>

          <ScrollArea className="w-full h-full">
            <ScrollAreaViewport>
              <SourceChunkList threadId={id} apiToken={apiToken} />
            </ScrollAreaViewport>
            <ScrollAreaScrollbar>
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
          </ScrollArea>
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
    limit: 50,
  })

  const { data: feedbackData } = api.feedback.getList.useQuery({
    threadId: threadId,
  })

  const feedbackArray = feedbackData?.chat_feedback.map((data) => ({
    chatId: data.chatId,
    typeId: data.typeId,
  }))

  const chatData = data?.chats ?? []

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const latestMessageElement = document.getElementById(
        chatData[0]?.id ?? '',
      )
      if (latestMessageElement) {
        latestMessageElement.scrollIntoView(false)
      }
    }
  }, [chatData])

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
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4 flex flex-col-reverse">
            {chatData.map((item) => {
              const feedback = feedbackArray?.find(
                (feedback) => feedback.chatId === item.id,
              )

              return (
                <div
                  ref={scrollRef}
                  id={item.id}
                  key={item.id}
                  className="space-y-2"
                >
                  <ChatThread key={item.id} isRight={item.roleId}>
                    {item.msg}
                  </ChatThread>

                  <div>
                    {item.roleId !== 1 && (
                      <div>
                        <div className="flex flex-row ml-16 space-x-2 rounded-xl max-w-[80%]">
                          <div
                            className={clsx(
                              'flex p-2 rounded-lg items-center',
                              {
                                'bg-gray-300': arrPositiveType.includes(
                                  feedback?.typeId ?? NaN,
                                ),
                              },
                            )}
                          >
                            <Tooltip
                              className="z-[100]"
                              arrow="bottom-center"
                              content="User Like"
                            >
                              <IconButton
                                label="positive"
                                variant="link"
                                className="text-slate-700"
                              >
                                <Like className="w-4 h-4 cursor-pointer" />
                              </IconButton>
                            </Tooltip>
                          </div>

                          <div
                            className={clsx(
                              'flex p-2 rounded-lg items-center',
                              {
                                'bg-gray-300': arrNegativeType.includes(
                                  feedback?.typeId ?? NaN,
                                ),
                              },
                            )}
                          >
                            <Tooltip
                              className="z-[100]"
                              arrow="bottom-center"
                              content="User DisLike"
                            >
                              <IconButton
                                label="negative"
                                variant="link"
                                className="text-slate-700"
                              >
                                <DisLike className="w-4 h-4 cursor-pointer" />
                              </IconButton>
                            </Tooltip>
                          </div>
                          <FeedbackTypeBadge
                            typeId={feedback?.typeId ?? NaN}
                            isPositive={arrPositiveType.includes(
                              feedback?.typeId ?? NaN,
                            )}
                          />
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

interface SourceTypeBadgeProps {
  typeId: number
  isPositive: boolean
}

const getTypeLabel = (typeId: number) => {
  switch (typeId) {
    case FeedbackTypeEnum.TooLong:
      return 'Too Long'
    case FeedbackTypeEnum.TooShort:
      return 'TooShort'
    case FeedbackTypeEnum.Inaccurate:
      return 'Inaccurate'
    case FeedbackTypeEnum.HarmfulOrOffensive:
      return 'Harmful or Offensive'
    case FeedbackTypeEnum.NotHelpful:
      return 'Not Helpful'
    case FeedbackTypeEnum.Correct:
      return 'Correct'
    case FeedbackTypeEnum.EasyToUnderstand:
      return 'Easy To Understand'
    case FeedbackTypeEnum.Complete:
      return 'Complete'
    case FeedbackTypeEnum.OtherPositive:
    case FeedbackTypeEnum.OtherNegative:
      return 'Other'
    default:
      return ''
  }
}

const FeedbackTypeBadge = ({ typeId, isPositive }: SourceTypeBadgeProps) => {
  return (
    <>
      {getTypeLabel(typeId) !== '' && (
        <Badge appearance={isPositive ? 'success' : 'danger'}>
          {getTypeLabel(typeId)}
        </Badge>
      )}
    </>
  )
}
