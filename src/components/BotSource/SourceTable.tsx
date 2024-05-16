/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { useDisclosure } from '@dwarvesf/react-hooks'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Switch,
  Table,
  Typography,
} from '@mochi-ui/core'
import { EyeShowSolid, ThreeDotLine, TrashBinSolid } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api, type RouterOutputs } from '~/utils/api'
import { formatDatetime } from '~/utils/utils'
import { SourceDetailDrawer } from './SourceDetailDrawer'
import { SourceStatusBadge } from './SourceStatusBadge'
import { SourceTypeBadge } from './SourceTypeBadge'

type BotSource = RouterOutputs['botSource']['create']['0']

export const SourceTable = () => {
  const { id } = useParams()
  const { isOpen, onOpenChange, onOpen } = useDisclosure()
  const [activeSource, setActiveSource] = useState<BotSource>()
  const { data, isPending } = api.botSource.getByBotId.useQuery({
    botId: id as string,
  })

  return (
    <Card className="mt-10 shadow-input">
      <Table<BotSource>
        size="sm"
        columns={[
          {
            accessorKey: 'url',
            header: 'Url',
            width: 400,
            cell: (props) => {
              const { url, typeId } = props.row.original
              if (typeId === BotSourceTypeEnum.Link && url) {
                return (
                  <Button variant="link" className="!p-0 max-w-[300px]" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <span className="truncate">{url}</span>
                    </a>
                  </Button>
                )
              }
              return (
                <Typography level="inherit" className="truncate max-w-[300px]">
                  {url}
                </Typography>
              )
            },
          },
          {
            accessorKey: 'typeId',
            header: 'Type',
            width: 200,
            cell: (props) => {
              const { typeId } = props.row.original
              return (
                <div className="flex">
                  <SourceTypeBadge typeId={typeId} />
                </div>
              )
            },
          },
          {
            accessorKey: 'statusId',
            header: 'Status',
            width: 200,
            cell: (props) => {
              const { statusId } = props.row.original
              return (
                <div className="flex">
                  <SourceStatusBadge statusId={statusId} />
                </div>
              )
            },
          },
          {
            accessorKey: 'updatedAt',
            header: 'Updated on',
            width: 200,
            cell: (props) => {
              const { updatedAt, createdAt } = props.row.original
              return formatDatetime(updatedAt ?? createdAt, 'DD MMM YYYY')
            },
          },
          {
            accessorKey: '',
            header: 'Visibility',
            width: 200,
            cell: () => {
              return <Switch />
            },
          },
          {
            header: '',
            width: 50,
            accessorKey: 'id',
            cell: () => {
              return (
                <Button size="sm" color="neutral" variant="outline">
                  Sync
                </Button>
              )
            },
          },
          {
            header: '',
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        leftIcon={
                          <TrashBinSolid className="w-5 h-5 text-danger-outline-fg" />
                        }
                      >
                        <Typography level="h8" color="danger">
                          Delete
                        </Typography>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenu>
              )
            },
          },
        ]}
        isLoading={isPending}
        data={data?.botSources ?? []}
        emptyContent={
          <div className="pt-6 pb-2 text-center">
            <Typography>No sources yet</Typography>
          </div>
        }
      />
      <SourceDetailDrawer
        source={activeSource}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    </Card>
  )
}
