/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import {
  Button,
  Card,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  IconButton,
  Separator,
  Typography,
} from '@mochi-ui/core'
import { ArrowLeftLine, ArrowRightLine, SpinnerLine } from '@mochi-ui/icons'
import { useEffect, useState } from 'react'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api, type RouterOutputs } from '~/utils/api'

interface SourceDetailDrawerProps {
  onOpenChange: (open: boolean) => void
  isOpen: boolean
  source?: RouterOutputs['botSource']['create']['0']
}

export const SourceDetailDrawer = (props: SourceDetailDrawerProps) => {
  const { onOpenChange, isOpen, source } = props
  const { url: name, id, typeId, botId } = source ?? {}
  const isSitemap =
    typeId === BotSourceTypeEnum.Sitemap ||
    typeId === BotSourceTypeEnum.SitemapFile

  const [chunkListId, setChunkListId] = useState<string | null>(
    !isSitemap && id ? id : null,
  )

  useEffect(() => {
    if (id) {
      setChunkListId(!isSitemap && id ? id : null)
    }
  }, [id, isSitemap])

  return (
    <Drawer anchor="right" onOpenChange={onOpenChange} open={isOpen}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="p-6 w-[400px]" showCloseBtn>
          <div className="flex space-x-2 items-center">
            {chunkListId && isSitemap ? (
              <IconButton
                size="lg"
                label="back"
                onClick={() => setChunkListId(null)}
                variant="link"
                color="neutral"
                className="flex-none"
              >
                <ArrowLeftLine className="text-xl" />
              </IconButton>
            ) : null}
            <Typography level="h6" className="truncate max-w-[300px]">
              {name}
            </Typography>
          </div>

          <Separator className="my-3" />

          <div className="absolute inset-0 px-6 py-4 bottom-0 top-[66px] overflow-y-auto space-y-3">
            {!chunkListId && id && botId ? (
              <SourceParentList
                botId={botId}
                sourceId={id}
                onViewDetail={setChunkListId}
              />
            ) : null}
            {chunkListId ? <SourceChunkList sourceId={chunkListId} /> : null}
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

interface SourceParentListProps {
  sourceId: string
  botId: string
  onViewDetail: (id: string) => void
}

const SourceParentList = ({
  sourceId,
  botId,
  onViewDetail,
}: SourceParentListProps) => {
  const { data, isPending } = api.botSource.getByBotId.useQuery({
    botId,
    limit: 100,
    parentBotSourceID: sourceId,
  })

  const bsData = data?.botSources ?? []

  return (
    <>
      {isPending ? (
        <div className="py-6 flex justify-center">
          <SpinnerLine className="w-8 h-8 text-primary-plain-fg" />
        </div>
      ) : (
        bsData.map((item) => (
          <Card
            className="!bg-background-level1 overflow-auto flex items-center justify-between"
            key={item.id}
          >
            <Button variant="link" className="!p-0" asChild>
              <a
                href={item?.url ?? ''}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="truncate max-w-[270px]">{item?.url}</span>
              </a>
            </Button>
            <IconButton
              variant="outline"
              color="neutral"
              label="view detail"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetail(item.id)
              }}
            >
              <ArrowRightLine />
            </IconButton>
          </Card>
        ))
      )}
    </>
  )
}

const SourceChunkList = ({ sourceId }: { sourceId: string }) => {
  const { data, isPending } = api.botSourceExtractedDataRouter.getList.useQuery(
    {
      botSourceId: sourceId,
    },
  )
  const bsData = data?.data ?? []

  return (
    <>
      {isPending ? (
        <div className="py-6 flex justify-center">
          <SpinnerLine className="w-8 h-8 text-primary-plain-fg" />
        </div>
      ) : (
        bsData.map((item) => (
          <Card
            className="!bg-background-level1 overflow-auto max-h-[400px]"
            key={item.id}
          >
            {item?.data as string}
          </Card>
        ))
      )}
    </>
  )
}
