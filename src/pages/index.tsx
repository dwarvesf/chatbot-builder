import { useDisclosure } from '@dwarvesf/react-hooks'
import {
  Avatar,
  Button,
  Card,
  PageContent,
  SectionHeader,
  SectionHeaderActions,
  SectionHeaderTitle,
  Skeleton,
  Typography,
} from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import Link from 'next/link'
import { CreateBotModal } from '~/components/bot/CreateBotModal'
import { Repeat } from '~/components/common/Repeat'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { api } from '~/utils/api'

const Index: NextPage = () => {
  const { onOpenChange, isOpen, onOpen } = useDisclosure()
  const botsQuery = api.bot.getList.useQuery()
  const bots = botsQuery?.data ?? []
  const isFetchingBots = botsQuery.isLoading
  const isEmptyBots = bots.length === 0

  return (
    <>
      <SeoHead title="Dashboard" />
      <PageContent>
        <SectionHeader>
          <SectionHeaderTitle>
            <Typography className="text-2xl">Your Bots</Typography>
          </SectionHeaderTitle>
          <SectionHeaderActions className="!flex-nowrap">
            <Button
              color={isEmptyBots ? 'neutral' : undefined}
              variant={isEmptyBots ? 'outline' : undefined}
              onClick={onOpen}
              disabled={isFetchingBots}
            >
              Create new Bot
            </Button>
            <CreateBotModal
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              onSuccess={async () => {
                await botsQuery.refetch()
              }}
            />
          </SectionHeaderActions>
        </SectionHeader>
        {isFetchingBots ? (
          <div className="grid gap-4 grid-cols-4">
            <Repeat>
              <Card className="space-y-5">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="w-full h-6 rounded" />
                  <Skeleton className="w-1/2 h-6 rounded" />
                </div>
              </Card>
            </Repeat>
          </div>
        ) : (
          <>
            {isEmptyBots ? (
              <Card className="text-center space-y-3">
                <Typography level="h5">No bots</Typography>
                <Typography color="textSecondary">
                  Looks like you are missing a bot. Lets get you set up with
                  one!
                </Typography>
                <Button onClick={onOpen}>Create new Bot</Button>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-4">
                {bots.map((bot) => (
                  <Card asChild key={bot.id}>
                    <Link href={ROUTES.BOT_DETAIL(bot?.id)}>
                      <Avatar className="w-12 h-12" src="" />
                      <Typography level="h6">{bot.name}</Typography>
                      <Typography color="textSecondary">
                        {bot.description}
                      </Typography>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
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

export default Index
