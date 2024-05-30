import { useDisclosure } from '@dwarvesf/react-hooks'
import {
  Avatar,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  PageContent,
  SectionHeader,
  SectionHeaderActions,
  SectionHeaderTitle,
  Skeleton,
  Typography,
  toast,
} from '@mochi-ui/core'
import { EditLine, ThreeDotLine, TrashBinSolid } from '@mochi-ui/icons'
import type { GetServerSideProps, NextPage } from 'next'
import Link from 'next/link'
import { useState } from 'react'
import { CreateBotModal } from '~/components/bot/CreateBotModal'
import { ConfirmDialog } from '~/components/common/ConfirmDialog'
import { Repeat } from '~/components/common/Repeat'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { api, type RouterOutputs } from '~/utils/api'
import { formatDatetime } from '~/utils/utils'

type Bot = RouterOutputs['bot']['getList']['0']

const Index: NextPage = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const botsQuery = api.bot.getList.useQuery()
  const bots = botsQuery?.data ?? []
  const isFetchingBots = botsQuery.isLoading
  const isEmptyBots = bots.length === 0
  const {
    onOpenChange: onDeleteOpenChange,
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
  } = useDisclosure()
  const [activeBot, setActiveBot] = useState<Bot>()

  const { mutate: deleteBot, isPending: isDeletingBot } =
    api.bot.archive.useMutation({
      onSuccess: async () => {
        toast({
          description: 'Deleted Bot successfully',
          scheme: 'success',
        })
        await botsQuery?.refetch()
        onDeleteOpenChange(false)
      },
      onError: (error) => {
        toast({
          description: 'Failed to delete Bot',
          scheme: 'danger',
        })
        console.error(error)
      },
    })

  return (
    <>
      <SeoHead title="Dashboard" />
      <PageContent className="bg-background-level2">
        <SectionHeader className="mb-2">
          <SectionHeaderTitle>
            <Typography level="h6">Your Bots</Typography>
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
              <Card className="text-center space-y-3 !py-8">
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
                  <Card asChild key={bot.id} className="relative shadow-input">
                    <Link href={ROUTES.BOT_DETAIL(bot?.id)}>
                      <Avatar className="w-12 h-12" src="" />
                      <Typography level="h6" className="my-3">
                        {bot.name}
                      </Typography>
                      <Typography level="p6" color="textTertiary">
                        Updated on{' '}
                        {formatDatetime(
                          bot.updatedAt ?? bot.createdAt,
                          'DD MMM YYYY',
                        )}
                      </Typography>

                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 absolute right-1 top-1">
                          <IconButton
                            label="open"
                            variant="ghost"
                            color="neutral"
                          >
                            <ThreeDotLine className="w-5 h-5" />
                          </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuContent
                            className="min-w-[200px]"
                            align="start"
                          >
                            <Link href={ROUTES.BOT_DETAIL_SETTINGS(bot.id)}>
                              <DropdownMenuItem
                                leftIcon={<EditLine className="w-5 h-5" />}
                              >
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              leftIcon={
                                <TrashBinSolid className="w-5 h-5 text-danger-outline-fg" />
                              }
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveBot(bot)
                                onDeleteOpen()
                              }}
                            >
                              <Typography level="h8" color="danger">
                                Delete
                              </Typography>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenuPortal>
                      </DropdownMenu>
                    </Link>
                  </Card>
                ))}
                <ConfirmDialog
                  onConfirm={() => {
                    if (activeBot?.id) {
                      deleteBot({ botID: activeBot.id })
                    }
                  }}
                  isSubmitting={isDeletingBot}
                  title="Delete Bot"
                  onOpenChange={onDeleteOpenChange}
                  open={isDeleteOpen}
                  message="Are your sure to delete the bot?"
                  confirmButton={{ color: 'danger', text: 'Delete' }}
                />
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
