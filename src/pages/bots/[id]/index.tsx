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
import { FeedbackFormWrapper } from '~/components/FeedbackForm'
import { SeoHead } from '~/components/common/SeoHead'
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

const ChatThread = (props: {
  chatIdAssistant?: string
  sourcesLinks?: string[] | null
  avatar?: string
  children: React.ReactNode
  isRight?: boolean
  isError?: boolean
}) => {
  const { sourcesLinks, avatar, children, isRight, isError = false } = props

  return (
    <div className={clsx('flex', { 'justify-end': isRight })}>
      <div
        className={clsx('flex flex-1 gap-4', { 'flex-row-reverse': isRight })}
      >
        <Avatar src={avatar ?? ''} />
        <div
          className={clsx('p-4 rounded-xl max-w-[80%]', {
            'bg-secondary-100': isRight && !isError,
            'bg-background-level2': !isRight && !isError,
            'bg-danger-200': isError,
          })}
        >
          {children}
          <div>
            {!isRight && sourcesLinks?.length && sourcesLinks !== null ? (
              <>
                <Separator className="my-4" />
                Sources:
                <ul className="list-disc px-8">
                  {sourcesLinks?.map((link) => (
                    <li key={link}>
                      <a
                        className="text-blue-600 font-bold"
                        href={link ?? ''}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
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
        data.assistants?.[0]?.toString() ?? '',
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

  const handleToggle = (chatIdAssistant: string, isPositive: boolean) => {
    setOpenId(openId === chatIdAssistant ? null : chatIdAssistant)
    setIsPositiveFeedback(isPositive)
    setShowThankYou(null)
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

  // useEffect(() => {
  //   if (chatData) {
  //     addNewMessage(
  //       chatData.referSourceLinks ?? null,
  //       // chatData.assistants?.[0]?.[0]?.msg ?? '',
  //       chatData.res ?? '',
  //       false,
  //     )
  //   }
  // }, [JSON.stringify(chatData)])

  // useEffect(() => {
  //   if (chatError) {
  //     addNewMessage(null, chatError.message, false, true)
  //   }
  // }, [chatError])

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
              <ChatThread avatar={botLogoSources?.cloudPath ?? ''}>
                {serverThread?.chat?.msg}
              </ChatThread>
            ) : null}
            {thread.map((item, index) => (
              <>
                <ChatThread
                  key={index}
                  avatar={
                    item.isYou
                      ? profile?.image ?? ''
                      : botLogoSources?.cloudPath ?? ''
                  }
                  isRight={item.isYou}
                  isError={item.isError}
                  sourcesLinks={item.sourcesLinks}
                >
                  {item.message}
                </ChatThread>

                <div>
                  {!item.isYou && (
                    <div>
                      <div className="flex flex-row ml-16 space-x-2 rounded-xl max-w-[80%]">
                        <Tooltip arrow="bottom-center" content="Good response">
                          <IconButton
                            asChild
                            label="feedback-positive"
                            variant="link"
                            className="rounded-none hover:scale-110 text-black hover:text-green-600"
                            onClick={() => {
                              handleToggle(item.chatIdAssistant ?? '', true)
                            }}
                          >
                            <Like className="w-4 h-4 cursor-pointer" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip arrow="bottom-center" content="Bad response">
                          <IconButton
                            asChild
                            label="feedback-negative"
                            variant="link"
                            className="rounded-none hover:scale-110 text-black hover:text-red-500"
                            onClick={() => {
                              handleToggle(item.chatIdAssistant ?? '', false)
                            }}
                          >
                            <DisLike className="w-4 h-4 cursor-pointer" />
                          </IconButton>
                        </Tooltip>
                      </div>

                      {openId === item.chatIdAssistant ? (
                        <FeedbackFormWrapper
                          apiToken={apiToken}
                          threadId={serverThread?.thread?.id ?? ''}
                          chatId={item.chatIdAssistant ?? ''}
                          isPositive={isPositiveFeedback}
                          onSuccess={() =>
                            handleFeedbackSuccess(item.chatIdAssistant ?? '')
                          }
                          handleClose={() =>
                            handleToggle(
                              item.chatIdAssistant ?? '',
                              isPositiveFeedback,
                            )
                          }
                        />
                      ) : showThankYou === item.chatIdAssistant ? (
                        <div className="w-fit bg-background-level2 border rounded-lg p-4 ml-16 mt-4">
                          <Typography level="p4" fontWeight="md">
                            Thank you for your feedback
                          </Typography>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ))}
            {isPending || initialThreadPending || !serverThread ? (
              <ChatThread avatar={botLogoSources?.cloudPath ?? ''}>
                <Spinner className="mx-2" />
              </ChatThread>
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
