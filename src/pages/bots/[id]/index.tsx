import {
  Avatar,
  IconButton,
  PageContent,
  PageHeader,
  PageHeaderTitle,
  Typography,
} from '@mochi-ui/core'
import { PaperplaneSolid, Spinner } from '@mochi-ui/icons'
import clsx from 'clsx'
import type { GetServerSideProps, NextPage } from 'next'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { api } from '~/utils/api'

interface ThreadItem {
  message: string
  isYou: boolean
}

const ChatThread = (props: {
  avatar?: string
  children: React.ReactNode
  isRight?: boolean
}) => {
  const { avatar, children, isRight } = props

  return (
    <div className={clsx('flex', { 'justify-end': isRight })}>
      <div
        className={clsx('flex flex-1 gap-4', { 'flex-row-reverse': isRight })}
      >
        <Avatar src={avatar ?? ''} />
        <div
          className={clsx('p-4 rounded-xl max-w-[80%]', {
            'bg-secondary-100': isRight,
            'bg-background-level2': !isRight,
          })}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const BotDetail: NextPage = () => {
  const { id } = useParams()
  const { data } = useSession()
  const botQuery = api.bot.getById.useQuery(id as string)
  const { data: botIntegration } = api.botIntegrationRouter.get.useQuery({
    botId: id as string,
  })
  const {
    mutate: createChat,
    data: chatData,
    isPending,
  } = api.chatRouter.create.useMutation()

  const { handleSubmit, control, reset } = useForm<{
    message: string
  }>({
    defaultValues: { message: '' },
  })

  const [thread, setThread] = useState<ThreadItem[]>([])

  const addNewMessage = (message: string, isYou = false) => {
    setThread((prev) => [...prev, { message, isYou }])
  }

  useEffect(() => {
    if (chatData) {
      addNewMessage(chatData.assistants?.[0]?.[0]?.msg ?? '', false)
    }
  }, [JSON.stringify(chatData)])

  async function sendMessage(data: { message: string }) {
    const submittedMessage = data.message.trim()
    if (!submittedMessage) {
      return
    }
    try {
      createChat({
        message: data.message,
        apiToken: botIntegration?.[0]?.apiToken?.toString(),
      })
      addNewMessage(data.message, true)
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
              <Avatar src="" />
              <div>
                <Typography component="b">{botQuery.data?.name}</Typography>
                <Typography level="p5">Bot description</Typography>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 top-20 bottom-20 overflow-y-auto p-4 space-y-4">
            <ChatThread avatar="">Hello! how can I help you?</ChatThread>
            {thread.map((item, index) => (
              <ChatThread
                key={index}
                avatar={item.isYou ? data?.user.image ?? '' : ''}
                isRight={item.isYou}
              >
                {item.message}
              </ChatThread>
            ))}
            {isPending && (
              <ChatThread avatar="">
                <Spinner className="mx-2" />
              </ChatThread>
            )}
          </div>
          <div className="absolute bottom-0 inset-x-0 border-t">
            <form onSubmit={handleSubmit(sendMessage)}>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <input
                    placeholder="Send a message..."
                    className="h-20 w-full px-6 outline-none pr-10"
                    {...field}
                  />
                )}
              />
              <IconButton
                type="submit"
                label="Send"
                className="absolute right-5 top-6"
                disabled={isPending}
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
