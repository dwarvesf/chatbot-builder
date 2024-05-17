import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { Button, Card, Typography, toast } from '@mochi-ui/core'
import { ArrowUpSquareSolid } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { api } from '~/utils/api'

export function FileDocSource() {
  const { id } = useParams()
  const botId = id as string

  const { isPending, isSuccess, isError, error } =
    api.botSource.createBulk.useMutation()

  const { refetch: refreshSourceTable } = api.botSource.getByBotId.useQuery({
    botId,
  })

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Created source from links successfully',
        scheme: 'success',
      })
      await refreshSourceTable()
    }
    if (isError) {
      toast({
        description: 'Failed to import links',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  return (
    <Card className="mx-auto space-y-4 shadow-input">
      <div className="flex justify-between">
        <Typography level="p4">Upload file</Typography>
      </div>
      <div className="h-40 rounded-lg border-primary-500 border-dashed border-2 flex items-center flex-col justify-center">
        <ArrowUpSquareSolid className="text-3xl text-primary-600" />
        <Typography level="p3" className="font-semibold">
          Click to upload or drag and drop your file here{' '}
        </Typography>
        <Typography color="textTertiary" level="p5">
          Up to 50MB. Support PDF, TXT, DOCS
        </Typography>
      </div>
      <div className="flex justify-center">
        <Button loading={isPending} className="w-40">
          Upload and Train
        </Button>
      </div>
    </Card>
  )
}
