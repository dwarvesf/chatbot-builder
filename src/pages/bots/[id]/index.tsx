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
import { useEffect, useState } from 'react'
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
  openId: string | null
  chatIdAssistant?: string
  apiToken?: string
  threadId?: string
  avatar?: string
  isRight?: boolean
  isError?: boolean
  sourcesLinks?: string[] | null
  onFeedback?: (isPositive: boolean) => void
  showThankYou: string | null
  handleFeedbackSuccess: (chatIdAssistant: string) => void
  handleClose: () => void
  isPositiveFeedback: boolean
  isLatestMessage?: boolean
  children: React.ReactNode
}

const ChatThread = ({
  openId,
  chatIdAssistant,
  apiToken,
  threadId,
  sourcesLinks,
  avatar,
  children,
  isRight,
  isError = false,
  onFeedback,
  isLatestMessage,
  showThankYou,
  handleFeedbackSuccess,
  handleClose,
  isPositiveFeedback,
}: ChatThreadProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const showFeedbackButtons = isLatestMessage ?? isHovered

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
                <Typography level="p5">Sources:</Typography>
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

        {!isRight && showFeedbackButtons && (
          <div className={clsx('flex px-16 mt-2')}>
            <Tooltip arrow="bottom-center" content="Good response">
              <div className="p-2 hover:scale-110 rounded-md hover:bg-background-level3">
                <IconButton
                  asChild
                  label="feedback-positive"
                  variant="link"
                  className="rounded-none text-gray-600"
                  onClick={() => onFeedback && onFeedback(true)}
                >
                  <Like className="w-4 h-4 cursor-pointer" />
                </IconButton>
              </div>
            </Tooltip>
            <Tooltip arrow="bottom-center" content="Bad response">
              <div className="p-2 hover:scale-110 rounded-md hover:bg-background-level3">
                <IconButton
                  asChild
                  label="feedback-negative"
                  variant="link"
                  className="rounded-none text-gray-600"
                  onClick={() => onFeedback && onFeedback(false)}
                >
                  <DisLike className="w-4 h-4 cursor-pointer" />
                </IconButton>
              </div>
            </Tooltip>
          </div>
        )}

        {openId === chatIdAssistant && (
          <FeedbackFormWrapper
            apiToken={apiToken}
            threadId={threadId ?? ''}
            chatId={chatIdAssistant ?? ''}
            isPositive={isPositiveFeedback}
            onSuccess={() => handleFeedbackSuccess(chatIdAssistant ?? '')}
            handleClose={handleClose}
          />
        )}

        {showThankYou === chatIdAssistant && (
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

  const [openId, setOpenId] = useState<string | null>(null)
  const [showThankYou, setShowThankYou] = useState<string | null>(null)
  const [isPositiveFeedback, setIsPositiveFeedback] = useState(false)

  const handleFeedback = (chatIdAssistant: string, isPositive: boolean) => {
    setOpenId(chatIdAssistant)
    setIsPositiveFeedback(isPositive)
  }

  const handleFeedbackSuccess = (chatIdAssistant: string) => {
    setShowThankYou(chatIdAssistant)
    setOpenId(null)

    setTimeout(() => {
      setShowThankYou(null)
    }, 3000)
  }

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
              <Avatar src={botLogoSources?.cloudPath ?? ''} />
              <div>
                <Typography component="b">{sources?.widgetName}</Typography>
                <Typography level="p5">{sources?.widgetSubheading}</Typography>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 top-20 bottom-20 overflow-y-auto p-4 space-y-4">
            {!initialThreadPending && serverThread?.chat?.msg ? (
              <ChatThreadTempAssistant avatar={botLogoSources?.cloudPath ?? ''}>
                {serverThread?.chat?.msg}
              </ChatThreadTempAssistant>
            ) : null}
            {thread.map((item) => (
              <ChatThread
                key={item.chatIdAssistant}
                openId={openId}
                apiToken={apiToken}
                threadId={serverThread?.thread?.id ?? ''}
                chatIdAssistant={item.chatIdAssistant}
                isRight={item.isYou}
                isError={item.isError}
                avatar={
                  item.isYou
                    ? profile?.image ?? ''
                    : botLogoSources?.cloudPath ?? ''
                }
                sourcesLinks={item.sourcesLinks}
                isPositiveFeedback={isPositiveFeedback}
                onFeedback={
                  !item.isYou
                    ? (isPositive) =>
                        handleFeedback(item.chatIdAssistant ?? '', isPositive)
                    : undefined
                }
                handleClose={() => setOpenId(null)}
                showThankYou={showThankYou}
                handleFeedbackSuccess={handleFeedbackSuccess}
                isLatestMessage={
                  thread.at(-1)?.chatIdAssistant === item.chatIdAssistant
                }
              >
                {item.message}
              </ChatThread>
            ))}
            {isPending || initialThreadPending || !serverThread ? (
              <ChatThreadTempAssistant avatar={botLogoSources?.cloudPath ?? ''}>
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
                    placeholder={sources?.widgetPlaceholder ?? ''}
                    className="h-20 w-full px-6 outline-none pr-10"
                    {...field}
                  />
                )}
              />
              <IconButton
                type="submit"
                label="Send"
                className="absolute right-5 top-6"
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
