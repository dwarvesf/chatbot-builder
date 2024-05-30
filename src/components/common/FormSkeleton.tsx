import { Skeleton } from '@mochi-ui/core'

export function FormSkeleton() {
  return (
    <div className="max-w-[400px] space-y-4">
      <div className="flex flex-col w-full relative items-stretch overflow-hidden rounded gap-12">
        <div className="flex flex-col w-full gap-4">
          <Skeleton className="w-1/5 h-8 rounded-lg" />
        </div>
        <div className="flex flex-col w-full gap-4">
          <Skeleton className="w-2/5 h-4 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
        </div>

        <div className="flex flex-col w-full gap-4">
          <Skeleton className="w-2/5 h-4 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col w-full gap-4">
        <Skeleton className="w-1/5 h-4 rounded-lg" />
      </div>
      <div className="flex flex-col w-full gap-4">
        <Skeleton className="w-2/5 h-8 rounded-lg" />
      </div>
      <div className="flex flex-col w-full gap-4">
        <Skeleton className="w-1/5 h-4 rounded-lg" />
      </div>
      <div className="flex flex-col w-full gap-4">
        <Skeleton className="w-3/5 h-4 rounded-lg" />
      </div>
    </div>
  )
}
