import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { Card, Typography, toast } from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api } from '~/utils/api'
import SourceFileUploader from './SourceFileUploader'

export function FileDocSource() {
  const { id } = useParams()
  const botId = id as string

  const { mutate: createSource } = api.botSource.create.useMutation()

  const { isSuccess, isError, error } = api.botSource.createBulk.useMutation()
  const { refetch: refreshSourceTable } = api.botSource.getByBotId.useQuery({
    botId,
  })

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Created source from docs successfully',
        scheme: 'success',
      })
      await refreshSourceTable()
    }
    if (isError) {
      toast({
        description: 'Failed to import docs',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  const onUploadSuccess = async (url: string, name?: string) => {
    if (!url) {
      return
    }
    createSource({ botId, url, name, typeId: BotSourceTypeEnum.File })
  }

  return (
    <Card className="mx-auto space-y-4 shadow-input">
      <div className="flex justify-between">
        <Typography level="p4">Upload file</Typography>
      </div>
      <SourceFileUploader onSuccess={onUploadSuccess} />
    </Card>
  )
}
