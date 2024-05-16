/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import {
  Card,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  Separator,
  Typography,
} from '@mochi-ui/core'
import { SpinnerLine } from '@mochi-ui/icons'
import { api, type RouterOutputs } from '~/utils/api'

interface SourceDetailDrawerProps {
  onOpenChange: (open: boolean) => void
  isOpen: boolean
  source?: RouterOutputs['botSource']['create']['0']
}

export const SourceDetailDrawer = (props: SourceDetailDrawerProps) => {
  const { onOpenChange, isOpen, source } = props
  const { url, id } = source ?? {}
  const { data, isPending } = api.botSourceExtractedDataRouter.getList.useQuery(
    {
      botSourceId: id ?? '',
    },
  )

  return (
    <Drawer anchor="right" onOpenChange={onOpenChange} open={isOpen}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="p-6 w-[400px]" showCloseBtn>
          <div className="flex flex-col items-start">
            <Typography level="h6" className="truncate max-w-[300px]">
              {url}
            </Typography>
          </div>

          <Separator className="my-3" />
          <div className="absolute inset-0 px-6 py-4 bottom-0 top-[66px] overflow-y-auto">
            {isPending ? (
              <div className="py-6 flex justify-center">
                <SpinnerLine className="w-8 h-8 text-primary-plain-fg" />
              </div>
            ) : (
              (data || []).map((item) => (
                <Card
                  className="bg-background-level1 overflow-auto max-h-[400px]"
                  key={item.id}
                >
                  {item?.data as string}
                </Card>
              ))
            )}
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}
