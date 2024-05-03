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
  Tabs,
} from '@mochi-ui/core'
import { MenuSolid, RefreshSolid } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '~/utils/api'
import { SourceLink } from './SourceLink'
import { SourceSitemap } from './SourceSitemap'

type SourceTab = {
  title: string
  subTitle: string
}

type Source = {
  id: number
  title: string
  fileType: string
  status: string
  updatedOn: string
  autoSync: string
  visibility: string
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
  const [loading, setLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(5)
  const [dataType, setDataType] = useState<string>('Files / URLs')
  const [data, setData] = useState<Source[]>([])
  const sources = api.botSource.getByBotId.useQuery(id as string).data

  const fetchData = ({
    page,
    dataType,
  }: {
    page?: number
    dataType?: string
  }) => {
    // fetch data
    setLoading(true)
    try {
      // fetch data
      console.log('fetching data', page, dataType, id)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    // fetch data
    fetchData({ page })
    // mock data
    setData([
      {
        id: 1,
        title: 'File 1',
        fileType: 'File',
        status: 'Active',
        updatedOn: '2021-10-01',
        autoSync: 'Yes',
        visibility: 'Public',
      },
      {
        id: 2,
        title: 'URL 1',
        fileType: 'URL',
        status: 'Active',
        updatedOn: '2021-10-01',
        autoSync: 'Yes',
        visibility: 'Public',
      },
      {
        id: 3,
        title: 'File 2',
        fileType: 'File',
        status: 'Active',
        updatedOn: '2021-10-01',
        autoSync: 'Yes',
        visibility: 'Public',
      },
      {
        id: 4,
        title: 'URL 2',
        fileType: 'URL',
        status: 'Active',
        updatedOn: '2021-10-01',
        autoSync: 'Yes',
        visibility: 'Public',
      },
      {
        id: 5,
        title: 'File 3',
        fileType: 'File',
        status: 'Active',
        updatedOn: '2021-10-01',
        autoSync: 'Yes',
        visibility: 'Public',
      },
    ])
  }, [])

  const handleTabClick = (tab: SourceTab) => {
    setCurrentTab(tab)
  }

  const handleChangePage = (page: number) => {
    setPage(page)
    fetchData({ page })
  }

  const handleChangePerPage = (perPage: number) => {
    setPerPage(perPage)
  }

  const handleChangeDataType = (dataType: string) => {
    setDataType(dataType)
    fetchData({ page })
  }

  const handleSync = async (id: string) => {
    // sync data
    console.log('Syncing data', id)
  }

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
              accessorKey: 'fileType',
              header: 'File type',
              cell: (data) => {
                return (
                  <span
                    className={`text-sm text-white font-semibold px-2 py-1 rounded-md ${
                      data.row?.original.fileType === 'File'
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                  >
                    {data.row?.original.fileType}
                  </span>
                )
              }
            },
            {
              accessorKey: 'status',
              header: 'Status',
              cell: (data) => {
                return (
                  <span
                    className={`text-sm text-white font-semibold px-2 py-1 rounded-md ${
                      data.row?.original.status === 'Active'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {data.row?.original.status}
                  </span>
                )
              }
            },
            {
              accessorKey: 'updatedOn',
              header: 'Updated On',
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
                    defaultChecked={data.row?.original.visibility === 'Public'}
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
          isLoading={loading}
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
          totalItems={50}
          totalPages={10}
        />
      </div>
    </>
  )
}
