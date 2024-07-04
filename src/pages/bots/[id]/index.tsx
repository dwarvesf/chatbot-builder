/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import {
  Avatar,
  IconButton,
  PageContent,
  PageHeader,
  PageHeaderTitle,
  Separator,
  Tooltip,
  Typography,
} from '@mochi-ui/core'
import { PaperplaneSolid, Spinner } from '@mochi-ui/icons'
import clsx from 'clsx'
import type { GetServerSideProps, NextPage } from 'next'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { SeoHead } from '~/components/common/SeoHead'
import { FeedbackFormWrapper } from '~/components/FeedbackForm'
import { DisLike, Like } from '~/components/icons/svg'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { api } from '~/utils/api'

interface ThreadItem {
  chatIdAssistant?: string
  sourcesLinks?: string[] | null
  message: string
  isYou: boolean
  isError?: boolean
}

interface ChatThreadProps {
  chatIdAssistant?: string
  apiToken?: string
  threadId?: string
  avatar?: string
  isRight?: boolean
  isError?: boolean
  sourcesLinks?: string[] | null
  isLatestMessage?: boolean
  children: React.ReactNode
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  chatIdAssistant,
  apiToken,
  threadId,
  sourcesLinks,
  avatar,
  isRight,
  isError = false,
  isLatestMessage,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [activeFeedback, setActiveFeedback] = useState<
    'like' | 'dislike' | null
  >(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isPositiveFeedback, setIsPositiveFeedback] = useState(false)
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState<
    'like' | 'dislike' | null
  >(null)

  const scrollToRef = useRef<null | HTMLDivElement>(null)
  const scrollToBottom = () => {
    scrollToRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [isOpen])

  const handleFeedbackClick = (type: 'like' | 'dislike') => {
    if (isFeedbackSubmitted) return

    if (activeFeedback === type) {
      setActiveFeedback(null)
      setIsOpen(false)
    } else {
      setActiveFeedback(type)
      setIsOpen(true)
      setIsPositiveFeedback(type === 'like')
    }
  }

  const handleFeedbackSuccess = () => {
    setSubmittedFeedback(activeFeedback) // Store the submitted feedback type
    setShowThankYou(true)
    setIsOpen(false)
    setActiveFeedback(null) // handle click thumbs up or thumb down
    setIsFeedbackSubmitted(true) // will disable all thumbs up and thumb down after submit form

    setTimeout(() => {
      setShowThankYou(false)
    }, 3000)
  }

  return (
    <div
      className={clsx('flex', { 'justify-end': isRight })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col w-full">
        <div
          className={clsx('flex gap-4', {
            'flex-row-reverse': isRight,
          })}
        >
          <Avatar src={avatar ?? ''} />
          <div
            className={clsx('p-4 rounded-xl max-w-[80%] relative', {
              'bg-secondary-100': isRight && !isError,
              'bg-background-level2': !isRight && !isError,
              'bg-danger-200': isError,
            })}
          >
            {children}

            {!isRight && sourcesLinks?.length && sourcesLinks !== null && (
              <>
                <Separator className="my-4" />
                <Typography level="p5" fontWeight="lg">
                  Sources:
                </Typography>
                <ul className="list-disc px-8">
                  {sourcesLinks.map((link) => (
                    <li key={link}>
                      <a
                        className="text-blue-600 font-bold"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {!isRight && (isLatestMessage || isHovered || activeFeedback) && (
          <div className="flex px-16 mt-2 ">
            <div className="flex items-center">
              <Tooltip arrow="bottom-center" content="Good response">
                <div
                  className={clsx('p-2 hover:scale-110 rounded-md', {
                    'bg-gray-300': activeFeedback === 'like' && isOpen,
                    'hover:bg-background-level3':
                      activeFeedback !== 'like' && !isFeedbackSubmitted,
                    'opacity-50 cursor-not-allowed':
                      isFeedbackSubmitted && submittedFeedback !== 'like',
                  })}
                >
                  <IconButton
                    asChild
                    label="feedback-positive"
                    variant="link"
                    className={clsx('rounded-none', {
                      'text-black':
                        isFeedbackSubmitted && submittedFeedback === 'like',
                      'text-slate-600':
                        !isFeedbackSubmitted || submittedFeedback !== 'like',
                    })}
                    onClick={() => handleFeedbackClick('like')}
                    disabled={isFeedbackSubmitted}
                  >
                    <Like className="w-4 h-4 cursor-pointer" />
                  </IconButton>
                </div>
              </Tooltip>
              <Tooltip arrow="bottom-center" content="Bad response">
                <div
                  className={clsx('p-2 hover:scale-110 rounded-md', {
                    'bg-gray-300': activeFeedback === 'dislike' && isOpen,
                    'hover:bg-background-level3':
                      activeFeedback !== 'dislike' && !isFeedbackSubmitted,
                    'opacity-50 cursor-not-allowed':
                      isFeedbackSubmitted && submittedFeedback !== 'dislike',
                  })}
                >
                  <IconButton
                    asChild
                    label="feedback-negative"
                    variant="link"
                    className={clsx('rounded-none', {
                      'text-black':
                        isFeedbackSubmitted && submittedFeedback === 'dislike',
                      'text-slate-600':
                        !isFeedbackSubmitted || submittedFeedback !== 'dislike',
                    })}
                    onClick={() => handleFeedbackClick('dislike')}
                    disabled={isFeedbackSubmitted}
                  >
                    <DisLike className="w-4 h-4 cursor-pointer" />
                  </IconButton>
                </div>
              </Tooltip>
            </div>
          </div>
        )}
        {isOpen && (
          <div ref={scrollToRef}>
            <FeedbackFormWrapper
              apiToken={apiToken}
              threadId={threadId ?? ''}
              chatId={chatIdAssistant ?? ''}
              isPositive={isPositiveFeedback}
              onSuccess={handleFeedbackSuccess}
              handleClose={() => setIsOpen(false)}
            />
          </div>
        )}
        {showThankYou && (
          <div className="w-fit bg-background-level2 border rounded-lg p-4 ml-16 mt-4">
            <Typography level="p4" fontWeight="md">
              Thank you for your feedback
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}

const ChatThreadTempAssistant = (props: {
  avatar?: string
  children: React.ReactNode
}) => {
  const { avatar, children } = props

  return (
    <div className="flex justify-end ">
      <div className="flex flex-1 gap-4 ">
        <Avatar src={avatar ?? ''} />
        <div className="p-4 rounded-xl max-w-[80%] bg-background-level2">
          {children}
        </div>
      </div>
    </div>
  )
}

const BotDetail: NextPage = () => {
  const { id } = useParams() ?? {}
  const { data: profile } = api.user.getUser.useQuery()
  const { data: sources } = api.bot.getById.useQuery(id as string)
  const { data: botLogoSources } = api.attachments.getById.useQuery(
    sources?.botAvatarAttachmentId ?? '',
    {
      enabled:
        sources?.botAvatarAttachmentId !== undefined &&
        sources?.botAvatarAttachmentId !== null &&
        sources?.botAvatarAttachmentId !== '',
    },
  )

  const { data: botIntegration } = api.botIntegrationRouter.get.useQuery({
    botId: id as string,
  })

  const avatarBot = botLogoSources?.cloudPath ?? ''
  const apiToken = botIntegration?.[0]?.apiToken?.toString()

  const {
    mutate: createNewThread,
    data: serverThread,
    isPending: initialThreadPending,
  } = api.thread.create.useMutation()

  const { mutate: createChat, isPending } = api.chatRouter.create.useMutation({
    onSuccess: async (data) => {
      if (!data) {
        return
      }
      addNewMessage(
        data.chatIdAssistants ?? '',
        data.referSourceLinks ?? null,
        data.assistants?.[0]?.[0]?.msg ?? '',
        false,
      )
    },
    onError: (error) => {
      console.error(error)
      addNewMessage('', null, error.message, false, true)
    },
  })

  const { handleSubmit, control, reset } = useForm<{
    message: string
  }>({
    defaultValues: { message: '' },
  })

  const [thread, setThread] = useState<ThreadItem[]>([])

  const addNewMessage = (
    chatIdAssistant: string,
    sourcesLinks: string[] | null,
    message: string,
    isYou = false,
    isError = false,
  ) => {
    setThread((prev) => [
      ...prev,
      { chatIdAssistant, sourcesLinks, message, isYou, isError },
    ])
  }

  useEffect(() => {
    if (!serverThread && apiToken) {
      createNewThread({
        title: 'Preview',
        firstMessage:
          sources?.widgetWelcomeMsg ?? 'Hey there! How can I help you?',
        apiToken: apiToken,
      })
    }
  }, [createNewThread, serverThread, apiToken])

  async function sendMessage(data: { message: string }) {
    const submittedMessage = data.message.trim()
    if (!submittedMessage) {
      return
    }
    try {
      createChat({
        message: data.message,
        apiToken,
        threadId: serverThread?.thread?.id ?? '',
      })
      addNewMessage('', null, data.message, true)
      reset()
    } catch (error) {
      console.log(error)
    }
  }

  const scrollToRef = useRef<null | HTMLDivElement>(null)
  const scrollToBottom = () => {
    scrollToRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [addNewMessage])

  return (
    <>
      <SeoHead title="Bot" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Preview</PageHeaderTitle>
      </PageHeader>
      <PageContent className="bg-background-level2">
        <div className="border rounded-lg min-h-[calc(100dvh-240px)] bg-white relative">
          <div className="absolute top-0 flex items-center inset-x-0 border-b h-20 px-4">
            <div className="flex space-x-4">
              <Avatar src={avatarBot} />
              <div>
                <Typography component="b">{sources?.widgetName}</Typography>
                <Typography level="p5">{sources?.widgetSubheading}</Typography>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 top-20 bottom-20 overflow-y-auto p-4 space-y-4">
            {!initialThreadPending && serverThread?.chat?.msg ? (
              <ChatThreadTempAssistant avatar={avatarBot}>
                {serverThread?.chat?.msg}
              </ChatThreadTempAssistant>
            ) : null}
            {thread.map((item, index) => (
              <div ref={scrollToRef} key={index}>
                <ChatThread
                  key={item.chatIdAssistant}
                  apiToken={apiToken}
                  threadId={serverThread?.thread?.id ?? ''}
                  chatIdAssistant={item.chatIdAssistant}
                  isRight={item.isYou}
                  isError={item.isError}
                  avatar={item.isYou ? profile?.image ?? '' : avatarBot}
                  sourcesLinks={item.sourcesLinks}
                  isLatestMessage={
                    thread.at(-1)?.chatIdAssistant === item.chatIdAssistant
                  }
                >
                  {item.message}
                </ChatThread>
              </div>
            ))}
            {isPending || initialThreadPending || !serverThread ? (
              <ChatThreadTempAssistant avatar={avatarBot}>
                <Spinner className="mx-2" />
              </ChatThreadTempAssistant>
            ) : null}
          </div>
          <div className="absolute bottom-0 inset-x-0 border-t">
            <form onSubmit={handleSubmit(sendMessage)}>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <input
                    autoComplete="off"
                    placeholder={sources?.widgetPlaceholder ?? ''}
                    className="h-14 w-full px-6 outline-none pr-10"
                    {...field}
                  />
                )}
              />
              <IconButton
                type="submit"
                label="Send"
                className="absolute right-5 top-2"
                disabled={isPending || initialThreadPending}
              >
                {isPending ? <Spinner /> : <PaperplaneSolid />}
              </IconButton>
            </form>
          </div>
        </div>
      </PageContent>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  })

  if (!session) {
    return {
      redirect: {
        destination: ROUTES.LOGIN,
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default BotDetail
