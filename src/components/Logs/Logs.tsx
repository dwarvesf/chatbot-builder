import { useDisclosure } from '@dwarvesf/react-hooks'
import {
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
  Table,
  Typography,
} from '@mochi-ui/core'
import { EyeShowSolid, ThreeDotLine } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { api, type RouterOutputs } from '~/utils/api'
import { formatDatetime } from '~/utils/utils'
import { ChatDetailDrawer } from './LogsDetailDrawer'

type ChatSource = RouterOutputs['thread']['getList']['threads']['0']

export const Logs = () => {
  const { id } = useParams() ?? {}
  const { isOpen, onOpenChange, onOpen } = useDisclosure()
  const [activeSource, setActiveSource] = useState<ChatSource>()

  const { data: botIntegration } = api.botIntegrationRouter.get.useQuery({
    botId: id as string,
  })

  const apiToken = botIntegration?.[0]?.apiToken?.toString()

  const { data: sources, isPending } = api.thread.getList.useQuery({
    apiToken: apiToken,
    limit: 20,
  })

  return (
    <div className="mt-10">
      <Typography level="h6" className="mb-4">
        Chat history
      </Typography>
      <Typography level="p5" fontWeight="sm" className="mb-4">
        The logs record the running status of the application, including user
        inputs and AI replies.
      </Typography>
      <Card className="shadow-input">
        <Table<ChatSource>
          size="sm"
          columns={[
            {
              accessorKey: 'createdAt',
              header: 'time',
              width: 150,
              cell: (props) => {
                const { updatedAt, createdAt } = props.row.original
                return formatDatetime(updatedAt ?? createdAt, 'DD MMM YYYY')
              },
            },
            {
              accessorKey: 'id',
              header: 'id chat',
              width: 400,
              cell: (props) => {
                const { id } = props.row.original
                return (
                  <Typography level="inherit" className="truncate">
                    {id ?? ''}
                  </Typography>
                )
              },
            },

            {
              accessorKey: 'title',
              header: 'title',
              width: 100,
              cell: (props) => {
                const { title } = props.row.original
                return (
                  <Typography level="inherit" className="truncate">
                    {title ?? ''}
                  </Typography>
                )
              },
            },

            {
              accessorKey: '',
              header: 'message count',
              width: 50,
              cell: (props) => {
                const { data } = api.chatRouter.getList.useQuery({
                  apiToken: apiToken,
                  threadId: props.row.original.id,
                })
                return (
                  <Typography
                    level="inherit"
                    className="flex justify-center truncate"
                  >
                    {data?.pagination.total ?? ''}
                  </Typography>
                )
              },
            },

            {
              accessorKey: '',
              header: 'user rate',
              width: 50,
              cell: (props) => {
                const { data } = api.feedback.getList.useQuery({
                  threadId: props.row.original.id,
                })

                return (
                  <Typography
                    level="inherit"
                    className="flex justify-center truncate"
                  >
                    {data?.pagination.total === 0
                      ? 'N/A'
                      : data?.pagination.total}
                  </Typography>
                )
              },
            },

            {
              header: 'view chat',
              width: 50,
              accessorKey: 'id',
              cell: (props) => {
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5">
                      <IconButton label="open" variant="ghost" color="neutral">
                        <ThreeDotLine />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent
                        className="min-w-[200px]"
                        align="start"
                      >
                        <DropdownMenuItem
                          leftIcon={<EyeShowSolid className="w-5 h-5" />}
                          onClick={() => {
                            onOpen()
                            setActiveSource(props.row.original)
                          }}
                        >
                          View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuPortal>
                  </DropdownMenu>
                )
              },
            },
          ]}
          isLoading={isPending}
          data={sources?.threads ?? []}
          emptyContent={
            <div className="pt-6 pb-2 text-center">
              <Typography>No sources yet</Typography>
            </div>
          }
        />
        {activeSource ? (
          <ChatDetailDrawer
            apiToken={apiToken ?? ''}
            source={activeSource}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </Card>
    </div>
  )
}
