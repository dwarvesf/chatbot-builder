import {
  Button,
  Card,
  IconButton,
  Pagination,
  Switch,
  TabContent,
  TabList,
  TabTrigger,
  Table,
  Tabs
} from '@mochi-ui/core'
import { MenuSolid, RefreshSolid } from '@mochi-ui/icons'
import moment from 'moment'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { api } from '~/utils/api'
import { SourceLink } from './SourceLink'
import { SourceSitemap } from './SourceSitemap'

type SourceTab = {
  title: string
  subTitle: string
}

type Source = {
  id: number
  url: string
  fileType: string
  statusId: string
  updatedAt: string
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

export const BotSource = () => {
  const id = useParams()?.id
  const [currentTab, setCurrentTab] = useState<SourceTab>(
    SOURCE_TABS[0] ?? { title: '', subTitle: '' },
  )
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(5)
  const [dataType, setDataType] = useState<string>('Files / URLs')
  const { data: sources, isLoading }= api.botSource.getByBotId.useQuery(id as string)
  const { mutate: syncSource, error: syncError } = api.botSource.sync.useMutation()

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

  const handleSync = async (id: string) => {
    // sync data
    syncSource({
      botSourceId: id,
    })
  }

  const data = sources ? sources?.map((item) => {
    return {
      id: item.id,
      title: '',
      url: item.url,
      updatedAt: item.updatedAt,
      typeId: item.typeId,
      statusId: item.statusId,
      action: item.statusId,
      autoSync: true,
      visibility: 'public'
    }
  }): []

  console.log(data)

  return (
    <>
      <span className="flex pb-3">{currentTab.subTitle}</span>
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
                <SourceLink />
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
                className={`focus:ring-gray-200$ rounded-md  px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 ${ dataType === tab.title ? 'bg-blue-400' : 'bg-white'}`}
                key={tab.title}
                onClick={() => {
                  handleChangeDataType(tab.title)
                }}
                color="black"
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
                    <span className="text-sm text-black font-semibold text-wrap">
                      {data.row?.original.title}
                    </span>
                  </div>
                )
              },
              header: 'Title',
            },
            {
              accessorKey: 'url',
              cell: (data) => {
                return (
                  <div>
                    <span className="text-sm text-black font-semibold text-wrap max-w-9 whitespace-nowrap text-ellipsis overflow-hidden">
                      {data.row?.original.url}
                    </span>
                  </div>
                )
              },
              header: 'Url',
            },
            {
              accessorKey: 'typeId',
              header: 'File type',
              cell: (data) => {
                return (
                  <span
                    className={`text-sm text-white font-semibold px-2 py-1 rounded-md ${
                      data.row?.original.typeId === 1
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                  >
                    {data.row?.original.typeId === 1 ? 'Link' : 'File'}
                  </span>
                )
              }
            },
            {
              accessorKey: 'statusId',
              header: 'Status',
              cell: (data) => {
                return (
                  <span
                    className={`text-sm text-white font-semibold px-2 py-1 rounded-md ${
                      data.row?.original.statusId === 1
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {data.row?.original.statusId}
                  </span>
                )
              }
            },
            {
              accessorKey: 'updatedAt',
              header: 'Updated At',
              cell: (data) => {
                return (
                  <div>
                    <span className="text-sm text-black text-wrap">
                      {data.row?.original.updatedAt ? moment(data.row?.original.updatedAt).format('DD/MM/YYYY') : '-'}
                    </span>
                  </div>
                )
              }
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
                  <div>
                    <IconButton label="" color="white">
                      <RefreshSolid
                        height={20}
                        width={20}
                        color="blue"
                        onClick={async () => {
                          await handleSync(data.row.original.id.toString())
                        }}
                      />
                      <MenuSolid height={20} width={20} />
                    </IconButton>
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
              <span className="text-sm text-gray-500">
                No data found. Please upload a file or add a link
              </span>
            </div>
          }
          // onRow={function Va() {}}
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
    </>
  )
}
