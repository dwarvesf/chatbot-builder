/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import {
  Card,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  IconButton,
  Separator,
  Typography,
} from '@mochi-ui/core'
import { ArrowLeftLine, SpinnerLine } from '@mochi-ui/icons'
import { useState } from 'react'
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

  if (
    typeId === BotSourceTypeEnum.Sitemap ||
    typeId === BotSourceTypeEnum.SitemapFile
  ) {
  }

  return (
    <Drawer anchor="right" onOpenChange={onOpenChange} open={isOpen}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="p-6 w-[400px]" showCloseBtn>
          <div className="flex space-x-2 items-center">
            {chunkListId && isSitemap ? (
              <IconButton
                size="sm"
                label="back"
                onClick={() => setChunkListId(null)}
                variant="link"
                color="neutral"
              >
                <ArrowLeftLine />
              </IconButton>
            ) : null}
            <Typography level="h6" className="truncate max-w-[300px]">
              {name}
            </Typography>
          </div>

          <Separator className="my-3" />
          <div className="absolute inset-0 px-6 py-4 bottom-0 top-[66px] overflow-y-auto">
            {!chunkListId && id && botId ? (
              <SourceParentList
                botId={botId}
                sourceId={id}
                onItemClick={setChunkListId}
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
  onItemClick: (id: string) => void
}

const SourceParentList = ({ sourceId, botId }: SourceParentListProps) => {
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
            className="bg-background-level1 overflow-auto max-h-[400px]"
            key={item.id}
          >
            {item?.url}
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
            className="bg-background-level1 overflow-auto max-h-[400px]"
            key={item.id}
          >
            {item?.data as string}
          </Card>
        ))
      )}
    </>
  )
}
