/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Badge,
  Button,
  Card,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
  IconButton,
  Pagination,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Switch,
  TabContent,
  TabList,
  TabTrigger,
  Table,
  Tabs,
  Typography,
  useToast,
} from '@mochi-ui/core'
import { MenuSolid, RefreshSolid } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { BotSourceStatusEnum } from '~/model/bot-source-status'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api } from '~/utils/api'
import { formatDatetime } from '~/utils/utils'
import { SourceLink } from './SourceLink'
import { SourceSitemap } from './SourceSitemap'

interface SourceTab {
  title: string
  subTitle: string
}

const SOURCE_TABS: SourceTab[] = [
  {
    title: 'Links',
    subTitle: 'Enter your Links',
  },
  {
    title: 'Sitemaps',
    subTitle: 'Upload documents or add links to your knowledge base or website',
  },
]

const DATA_TABS = [
  {
    title: 'Files / URLs',
  },
  {
    title: 'Spreadsheets',
  },
  {
    title: 'Sitemap',
  },
]

interface SourceContent {
  id: string
  data: unknown
  createdAt: Date
  createdBy: string | null
  botSourceId: string
}

export const BotSource = () => {
  const id = useParams()?.id
  const { toast } = useToast()
  const [selectedSourceId, setSelectedSourceId] = useState<string>('')
  const [currentTab, setCurrentTab] = useState<SourceTab>(
    SOURCE_TABS[0] ?? { title: '', subTitle: '' },
  )
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(5)
  const [dataType, setDataType] = useState<string>('Files / URLs')
  const {
    data: sources,
    isLoading,
    refetch: refetchSources,
  } = api.botSource.getByBotId.useQuery({
    botId: id as string,
    typeIDs: [BotSourceTypeEnum.Link, BotSourceTypeEnum.Sitemap],
  })
  const { mutate: syncSource, error: syncError } =
    api.botSource.sync.useMutation()
  const { mutate: deleteSourceById, error: deleteError } =
    api.botSource.deleteById.useMutation()
  const { data: sourceContents = [], isLoading: isLoadingSourceContent } =
    api.botSourceExtractedDataRouter.getList.useQuery({
      botSourceId: selectedSourceId,
    })

  const handleTabClick = (tab: SourceTab) => {
    setCurrentTab(tab)
  }

  const handleChangePage = (page: number) => {
    setPage(page)
  }

  const handleChangePerPage = (perPage: number) => {
    setPerPage(perPage)
  }

  const handleChangeDataType = (dataType: string) => {
    setDataType(dataType)
  }

  const handleSync = (id: string) => {
    // sync data
    syncSource({
      botSourceId: id,
    })
  }

  const data = (sources ?? []).map((item) => {
    return {
      id: item.id,
      title: '',
      url: item.url,
      updatedAt: item.updatedAt,
      typeId: item.typeId,
      statusId: item.statusId,
      action: item.statusId,
      autoSync: true,
      visibility: 'public',
    }
  })

  const convertStatus = (status: number) => {
    switch (status) {
      case BotSourceStatusEnum.Created:
        return 'Created'
      case BotSourceStatusEnum.InProgress:
        return 'In Progress'
      case BotSourceStatusEnum.Completed:
        return 'Completed'
      case BotSourceStatusEnum.Failed:
        return 'Failed'
      case BotSourceStatusEnum.Crawling:
        return 'Training'
      case BotSourceStatusEnum.Embedding:
        return 'Training'
      default:
        return '-'
    }
  }

  const handleDelete = async (id: string) => {
    try {
      deleteSourceById({
        botSourceId: id,
      })
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }

    // reload data
    await refetchSources()
    toast({
      description: 'Delete successfully',
      scheme: 'success',
    })
  }

  const handleViewDetail = (id: string) => {
    setSelectedSourceId(id)
  }

  // trigger when add new link in SourceLink component to reload data
  const handleAddLink = async () => {
    // reload data
    await refetchSources()
  }

  return (
    <>
      <Drawer anchor={'right'} key={'right'}>
        <Typography className="flex pb-3">{currentTab.subTitle}</Typography>
        <Card>
          <div>
            <Tabs defaultValue={'Links'}>
              <TabList className="items-center justify-center rounded-md bg-gray-200 py-2">
                {Object.values(SOURCE_TABS).map((tab) => {
                  return (
                    <TabTrigger
                      className={`focus:ring-gray-200$ rounded-md  px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 ${currentTab.title === tab.title ? 'bg-white' : 'bg-gray-200'}`}
                      value={tab.title}
                      key={tab.title}
                      id={tab.title}
                      onClick={() => {
                        handleTabClick(tab)
                      }}
                    >
                      {tab.title}
                    </TabTrigger>
                  )
                })}
              </TabList>
              <div className="flex-1 p-6">
                <TabContent value="Links" key="Links" id="1">
                  <SourceLink addLink={handleAddLink} />
                </TabContent>
                <TabContent value="Sitemaps" key="Sitemaps" id="2">
                  <SourceSitemap />
                </TabContent>
              </div>
            </Tabs>
          </div>
        </Card>
        <div className="p-4 min-w-[48rem]">
          <div>
            {Object.values(DATA_TABS).map((tab) => {
              return (
                <Button
                  className={`focus:ring-gray-200$ rounded-md  px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 ${dataType === tab.title ? 'bg-blue-400' : 'bg-white'}`}
                  key={tab.title}
                  onClick={() => {
                    handleChangeDataType(tab.title)
                  }}
                  color="primary"
                >
                  {tab.title}
                </Button>
              )
            })}
          </div>
          <Table
            columns={[
              {
                accessorKey: 'title',
                cell: (data) => {
                  return (
                    <div>
                      <Typography className="max-w-[200px] text-sm text-black font-semibold text-wrap whitespace-nowrap text-ellipsis overflow-hidden">
                        {data.row?.original.title || data.row?.original.url}
                      </Typography>
                    </div>
                  )
                },
                header: 'Title',
              },
              {
                accessorKey: 'typeId',
                header: 'File type',
                cell: (data) => {
                  return (
                    <Typography
                      className={`text-sm text-white font-semibold px-2 py-1 rounded-md w-11 ${
                        data.row?.original.typeId === BotSourceTypeEnum.Link
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      }`}
                    >
                      {data.row?.original.typeId === BotSourceTypeEnum.Link
                        ? 'Link'
                        : 'File'}
                    </Typography>
                  )
                },
              },
              {
                accessorKey: 'statusId',
                header: 'Status',
                cell: (data) => {
                  return (
                    <Badge>{convertStatus(data.row?.original.statusId)}</Badge>
                  )
                },
              },
              {
                accessorKey: 'updatedAt',
                header: 'Updated At',
                cell: (data) => {
                  return (
                    <div>
                      <Typography className="text-sm text-black text-wrap">
                        {data.row?.original.updatedAt
                          ? formatDatetime(data.row?.original.updatedAt)
                          : '-'}
                      </Typography>
                    </div>
                  )
                },
              },
              {
                accessorKey: 'autoSync',
                header: 'Auto sync',
              },
              {
                accessorKey: 'visibility',
                header: 'Visibility',
                cell: (data) => {
                  return (
                    <Switch
                      defaultChecked={data.row?.original.url === 'Public'}
                    />
                  )
                },
              },
              {
                accessorKey: 'action',
                cell: (data) => {
                  return (
                    <div className="flex">
                      <IconButton label="">
                        <RefreshSolid
                          height={20}
                          width={20}
                          color="blue"
                          onClick={() => {
                            handleSync(data.row.original.id.toString())
                          }}
                        />
                      </IconButton>
                      <Popover>
                        <PopoverTrigger asChild>
                          <IconButton label="">
                            <MenuSolid height={20} width={20} />
                          </IconButton>
                        </PopoverTrigger>
                        <PopoverPortal>
                          <PopoverContent>
                            <div className="flex flex-col gap-1 justify-start">
                              <DrawerTrigger asChild>
                                <Button
                                  key="view-detail"
                                  color="primary"
                                  onClick={() => {
                                    handleViewDetail(
                                      data.row.original.id.toString(),
                                    )
                                  }}
                                >
                                  View detail
                                </Button>
                              </DrawerTrigger>
                              <Button
                                key="delete"
                                color="primary"
                                onClick={async () => {
                                  await handleDelete(
                                    data.row.original.id.toString(),
                                  )
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </PopoverPortal>
                      </Popover>
                    </div>
                  )
                },
                header: 'Action',
              },
            ]}
            data={data}
            isLoading={isLoading}
            stickyHeader
            emptyContent={
              <div className="flex justify-center items-center p-3">
                <Typography className="text-sm text-gray-500">
                  No data found. Please upload a file or add a link
                </Typography>
              </div>
            }
          />
          <Pagination
            initItemsPerPage={5}
            initalPage={1}
            onItemPerPageChange={handleChangePerPage}
            onPageChange={handleChangePage}
            totalItems={5}
            totalPages={1}
          />
        </div>
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerContent className={'text-center h-max p-6'} showCloseBtn>
            <div className="flex flex-col gap-2 py-2 w-[350px]">
              <Typography className="text-lg text-left font-semibold">
                Source detail
              </Typography>

              {isLoadingSourceContent ? (
                <Typography>Loading...</Typography>
              ) : (
                sourceContents?.map((content: SourceContent, index: number) => {
                  return (
                    <Typography
                      key={index}
                      className="text-sm text-gray-950 p-4 rounded bg-gray-100"
                    >
                      {content?.data as string}
                    </Typography>
                  )
                })
              )}
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  )
}
