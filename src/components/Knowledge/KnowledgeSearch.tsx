/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Button, Card, Typography, useToast } from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { api } from '~/utils/api'
import { SourceTypeBadge } from '../BotSource/SourceTypeBadge'
import { useState } from 'react'
import clsx from 'clsx'
import { CardSkeleton } from '../common/FormSkeleton'

export const KnowledgeSearch = () => {
  const { toast } = useToast()
  const { id } = useParams() ?? {}
  const [textLength, setTextLength] = useState(0)

  const { data: retrievalModels } =
    api.botSource.getRetrievalModelByBotSourceId.useQuery({
      botId: id as string,
    })

  const {
    data: context,
    mutate: searchRelatedContext,
    isPending,
  } = api.retrieval.search.useMutation({
    onError: (error) => {
      toast({
        description: 'Failed to search document',
        scheme: 'danger',
      })
      console.error(error)
    },
  })

  const { handleSubmit, control, setError } = useForm<{
    message: string
  }>({
    defaultValues: { message: '' },
  })

  async function sendMessage(data: { message: string }) {
    if (!retrievalModels) {
      return
    }

    if (data.message.length > 200) {
      setError('message', {
        type: 'manual',
        message: 'Message exceeds 200 characters limit',
      })
      return
    }

    try {
      searchRelatedContext({
        botId: id as string,
        type: retrievalModels.search_method,
        distance: retrievalModels.distance,
        top_k: retrievalModels.top_k,
        message: data.message,
      })
    } catch (error: any) {
      console.log(error)
    }
  }

  return (
    <div className="flex flex-row min-h-screen w-full space-x-4">
      <div className="space-y-4 min-w-[50%]">
        <div>
          <Typography level="h6" fontWeight="lg">
            Knowledge search
          </Typography>
          <Typography level="p5" fontWeight="md">
            Test the hitting effect of the Knowledge based on the given query
            text.
          </Typography>
        </div>

        <div className="flex flex-col border rounded-xl border-primary-500 bg-[#EEF4FF]">
          <Typography level="p4" fontWeight="lg" className="p-4">
            Source text
          </Typography>

          <div className="bg-white rounded-b-xl">
            <form onSubmit={handleSubmit(sendMessage)}>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <textarea
                    className="p-4 appearance-none outline-none bg-transparent rounded shrink-0 py-2.5 caret-primary-outline-fg placeholder:text-text-disabled min-h-[300px] text-sm w-full resize-none"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      setTextLength(e.target.value.length)
                    }}
                  />
                )}
              />
              <div className="w-full flex flex-row justify-between items-baseline p-4">
                <Typography
                  level="p5"
                  fontWeight="lg"
                  className={clsx({ 'text-red-700': textLength > 200 })}
                >{`${textLength}/200`}</Typography>
                <Button type="submit" className="w-fit">
                  Testing
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full min-w-[50%] space-y-4 p-4">
        <Typography level="h6" fontWeight="lg">
          Retrieval Paragraph
        </Typography>
        <div className="flex-wrap space-y-4">
          {isPending ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            context?.map((props, index) => {
              return (
                <Card
                  key={index}
                  className="flex flex-col space-y-4 drop-shadow-md"
                >
                  <Typography>{props.content}</Typography>
                  <div className="flex flex-row space-x-4">
                    <div className="flex items-center">
                      <SourceTypeBadge typeId={props.sourceType} />
                    </div>
                    <a
                      className="text-primary-700 font-semibold text-sm text-wrap"
                      href={props.referLinks ?? ''}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {props.sourceType !== BotSourceTypeEnum.Link
                        ? props.referName
                        : props.referLinks}
                    </a>
                  </div>
                </Card>
              )
            })
          )}

          {context?.length === 0 && (
            <Card className="flex flex-col space-y-4 drop-shadow-md">
              <Typography level="p4">No related context found</Typography>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
