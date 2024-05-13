import {
  Button,
  PageContent,
  PageHeader,
  PageHeaderTitle,
} from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { useParams } from 'next/navigation'
import { useRef } from 'react'
import { SeoHead } from '~/components/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { api } from '~/utils/api'

const BotDetail: NextPage = () => {
  const { id } = useParams()
  const botQuery = api.bot.getById.useQuery(id as string)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <>
      <SeoHead title="Bot" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Preview</PageHeaderTitle>
      </PageHeader>
      <PageContent className="bg-gray-50">
        <Button
          type="button"
          onClick={() => {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({ type: 'test' }),
              '*',
            )
          }}
        >
          Send test message to widget iframe
        </Button>
        <iframe
          ref={iframeRef}
          src="http://localhost:3001"
          className="min-h-[calc(100dvh-240px)] w-full rounded-lg"
        />
        {/* <div className="border rounded-lg min-h-[calc(100dvh-240px)] bg-white relative">
          <div className="absolute top-0 flex items-center inset-x-0 border-b h-20 px-4">
            <div className="flex space-x-4">
              <Avatar src="" />
              <div>
                <Typography component="b">{botQuery.data?.name}</Typography>
                <Typography level="p5">Bot description</Typography>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <input
                placeholder="Send a message..."
                className="h-20 w-full px-6 outline-none pr-10"
              />
              <IconButton
                type="submit"
                label="Send"
                className="absolute right-5 top-6"
              >
                <PaperplaneSolid />
              </IconButton>
            </form>
          </div>
        </div> */}
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
