import {
  Avatar,
  IconButton,
  PageContent,
  PageHeader,
  PageHeaderTitle,
  Typography,
} from '@mochi-ui/core'
import { PaperplaneSolid } from '@mochi-ui/icons'
import type { GetServerSideProps, NextPage } from 'next'
import { useParams } from 'next/navigation'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { api } from '~/utils/api'

const BotDetail: NextPage = () => {
  const { id } = useParams()
  const botQuery = api.bot.getById.useQuery(id as string)

  return (
    <>
      <SeoHead title="Bot" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Preview</PageHeaderTitle>
      </PageHeader>
      <PageContent className="bg-gray-50">
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
