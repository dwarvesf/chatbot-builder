/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
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

const DETAIL_MENUS = {
  VIEW_DETAIL: 'View detail',
  DELETE: 'Delete',
}

export const BotSource = () => {
  const id = useParams()?.id
  const [currentTab, setCurrentTab] = useState<SourceTab>(
    SOURCE_TABS[0] ?? { title: '', subTitle: '' },
  )
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(5)
  const [dataType, setDataType] = useState<string>('Files / URLs')
  const { data: sources, isLoading } = api.botSource.getByBotId.useQuery(
    id as string,
  )
  const { mutate: syncSource, error: syncError } =
    api.botSource.sync.useMutation()
  const sourceContents = [
    '[](/ "Kênh thông tin kinh tế - tài chính Việt Nam") * * * * * * * [Bảng giá điện tử](http://liveboard.cafef.vn "Bảng giá điện tử") [Danh mục đầutư](https://s.cafef.vn/danh-muc-dau-tu.chn "Danh mục đầu tư") MỚI NHẤT! [Đọc nhanh >>](/doc-nhanh.chn "Đọc nhanh") * * * * * * [](/ "Trang chủ")* [XÃ HỘI](/xa-hoi.chn "XÃ HỘI")* [CHỨNG KHOÁN](/thi-truong-chung-khoan.chn "CHỨNG KHOÁN")* [BẤT ĐỘNG SẢN](/bat-dong-san.chn "BẤT ĐỘNG SẢN")* [DOANH NGHIỆP](/doanh-nghiep.chn "DOANH NGHIỆP")* [NGÂN HÀNG](/tai-chinh-ngan-hang.chn "NGÂN HÀNG")* [TÀI CHÍNH QUỐC TẾ](/tai-chinh-quoc-te.chn "TÀI CHÍNH QUỐC TẾ")* [VĨ MÔ](/vi-mo-dau-tu.chn "VĨ MÔ")* [KINH TẾ SỐ](/kinh-te-so.chn "KINH TẾ SỐ")* [THỊ TRƯỜNG](/thi-truong.chn "THỊ TRƯỜNG")* [SỐNG](/song.chn "SỐNG")* [LIFESTYLE](/lifestyle.chn "LIFESTYLE")* [ ](javascript:;) Tin tức [Xã hội](/xa-hoi.chn "xã hội") [Doanh nghiệp](/doanh-nghiep.chn "doanhnghiệp") [Kinh tế vĩ mô](/vi-mo-dau-tu.chn "kinh tế vĩ mô") Tài chính - Chứng khoán [Chứng',
    'động sản sẽ tới sớm 15-04-2024 - 07:09 AM | [Bất động sản](/bat-dong-san.chn "Bất động sản") [Chia sẻ ](javascript:;) [](/ "Trang chủ") [](javascript:; "Chia sẻ") [](mailto:email@domain.com?subject=Ng%C3%A0y%20c%C3%A0ng%20nhi%E1%BB%81u%20nh%C3%B3m%20%E2%80%9Cc%C3%A1%20m%E1%BA%ADp%E2%80%9D%20%C4%91i%20s%C4%83n%20%C4%91%E1%BA%A5t%20%E1%BB%9F%20%E2%80%9Cch%C3%A2n%20s%C3%B3ng%E2%80%9D%2C%20chu%20k%E1%BB%B3%20t%C4%83ng%20gi%C3%A1%20b%E1%BA%A5t%20%C4%91%E1%BB%99ng%20s%E1%BA%A3n%20s%E1%BA%BD%20t%E1%BB%9Bi%20s%E1%BB%9Bm&body=https%3A%2F%2Fcafef.vn%2Fngay-cang-nhieu-nhom-ca-map-di-san-dat-o-chan-song-chu-ky-tang-gia-bat-dong-san-se-toi-som-188240415013645313.chn "email") ## Mặc dù vừa trải qua một giai đoạn trầm lắng kéo dài, song đất nền vẫn làkênh đầu tư được nhiều người ưa chuộng. * 14-04-2024[Khung cảnh đìu hiu trên tuyến phố đắt đỏ bậc nhất Hà Nội __](/khung-canh-diu-hiu-tren-tuyen-pho-dat-do-bac-nhat-ha-noi-188240414085656032.chn "Khung cảnh đìu hiu trên tuyến phố đắt đỏ bậc nhất Hà Nội")',
    'đìu hiu trên tuyến phố đắt đỏ bậc nhất Hà Nội")* 13-04-2024[Những trường hợp sẽ bị Nhà nước thu hồi sổ đỏ khi áp dụng Luật Đất đai 2024,... __](/nhung-truong-hop-se-bi-nha-nuoc-thu-hoi-so-do-khi-ap-dung-luat-dat-dai-2024-nguoi-dan-cam-nam-chac-trong-tay-188240413162937989.chn "Những trường hợp sẽ bị Nhà nước thu hồi sổ đỏ khi áp dụng Luật Đất đai 2024, người dân cầm nắm chắc trong tay ") * 13-04-2024[Không chỉ chung cư, giá nhà trong ngõ liên tục tăng mạnh, chuyên gia khẳng định:... __](/khong-chi-chung-cu-gia-nha-trong-ngo-lien-tuc-tang-manh-chuyen-gia-khang-dinh-kho-giam-188240413170443766.chn "Không chỉ chung cư, giá nhà trong ngõ liên tục tăng mạnh, chuyên gia khẳng định: “Khó giảm!” ") [TIN MỚI](javascript:; "TIN MỚI") **Đất nền vẫn là “món khoái khẩu” của nhà đầu tư** Cách đây chỉ 1 năm, phân khúc đất nền ở các khu vực đều rơi vào trầm lắng,thậm chí có nơi gần như “đóng băng”. Theo đó nhiều nhà đầu tư phải giảm giá 20- 30% hoặc nhiều hơn với mong muốn tìm được khách mua. Hiện nay, khung cảnh',
  ]

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

  const handleDelete = (id: string) => {
    console.log(id)
    // open confirm dialog

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
                  className={`focus:ring-gray-200$ rounded-md  px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 ${dataType === tab.title ? 'bg-blue-400' : 'bg-white'}`}
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
                      <IconButton label="" color="white">
                        <RefreshSolid
                          height={20}
                          width={20}
                          color="blue"
                          onClick={async () => {
                            await handleSync(data.row.original.id.toString())
                          }}
                        />
                      </IconButton>
                      <Popover>
                        <PopoverTrigger asChild>
                          <IconButton label="" color="white">
                            <MenuSolid height={20} width={20} />
                          </IconButton>
                        </PopoverTrigger>
                        <PopoverPortal>
                          <PopoverContent>
                            <div className="flex flex-col gap-1 justify-start">
                              <DrawerTrigger asChild>
                                <Button key="view-detail" color="black">
                                  View detail
                                </Button>
                              </DrawerTrigger>
                              <Button
                                key="delete"
                                color="black"
                                onClick={() => {
                                  handleDelete(data.row.original.id.toString())
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
          <DrawerContent
            className={'text-center h-max p-6'}
            showCloseBtn
          >
            <div className="flex flex-col gap-2 py-2 w-[350px]">
              <Typography className="text-lg text-left font-semibold">
                Source detail
              </Typography>
              {sourceContents.map((content, index) => {
                return (
                  <Typography
                    key={index}
                    className="text-sm text-gray-950 p-4 rounded bg-gray-100"
                  >
                    {content}
                  </Typography>
                )
              })}
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  )
}
