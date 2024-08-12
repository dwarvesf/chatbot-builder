/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Badge, Button, Card, Typography, useToast } from '@mochi-ui/core'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BotSourceTypeEnum } from '~/model/bot-source-type'
import { SearchTypeEnum } from '~/model/search-type'
import { api } from '~/utils/api'
import { SourceTypeBadge } from '../BotSource/SourceTypeBadge'
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

  const { handleSubmit, control } = useForm<{
    message: string
  }>({
    defaultValues: { message: '' },
  })

  async function sendMessage(data: { message: string }) {
    if (data.message.length > 200 || data.message.length < 10) {
      return
    }

    try {
      searchRelatedContext({
        botId: id as string,
        type: retrievalModels?.searchMethod ?? SearchTypeEnum.Vector,
        topK: retrievalModels?.topK ?? 2,
        similarityThreshold: retrievalModels?.similarityThreshold ?? 0.5,
        alpha: retrievalModels?.alpha ?? 0.5,
        message: data.message,
      })
    } catch (error: any) {
      console.log(error)
    }
  }

  return (
    <div className="flex flex-row min-h-screen w-full space-x-4">
      <div className="space-y-4 min-w-[50%]">
        <div className="flex flex-col">
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
                    className="p-4 appearance-none outline-none bg-transparent rounded shrink-0 py-2.5 caret-primary-outline-fg placeholder:text-text-disabled min-h-[200px] text-sm w-full resize-none"
                    {...field}
                    minLength={10}
                    maxLength={200}
                    onChange={(e) => {
                      field.onChange(e)
                      setTextLength(e.target.value.length)
                    }}
                  />
                )}
              />
              <div className="w-full flex flex-row justify-between items-baseline p-4">
                <Badge appearance={textLength === 200 ? 'danger' : 'primary'}>
                  <Typography level="p5" fontWeight="lg">
                    {`${textLength}/200`}
                  </Typography>
                </Badge>

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
        <div className="space-y-4">
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
                  className="flex flex-col space-y-2 drop-shadow-md text-wrap break-all"
                >
                  <Typography level="p4" fontWeight="md">
                    {props.content}
                  </Typography>
                  <div className="flex flex-row space-x-2 max-w-[400px]">
                    <div className="flex items-center">
                      <SourceTypeBadge typeId={props.sourceType} />
                    </div>
                    <Badge appearance="primary">
                      <a
                        className="text-primary-700 font-semibold text-sm text-wrap break-all"
                        href={props.referLinks ?? ''}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {props.sourceType !== BotSourceTypeEnum.File
                          ? props.referLinks
                          : props.referName}
                      </a>
                    </Badge>
                  </div>
                  <div className="flex flex-wrap">
                    <div className="flex items-center mr-2">
                      <Badge
                        appearance={
                          props.vectorRank === undefined ? 'danger' : 'success'
                        }
                      >
                        {`Vector rank: ${props.vectorRank ?? NaN}`}
                      </Badge>
                    </div>
                    <div className="flex items-center mr-2">
                      <Badge
                        appearance={
                          props.textRank === undefined ? 'danger' : 'success'
                        }
                      >
                        {`Full-text rank: ${props.textRank ?? NaN}`}
                      </Badge>
                    </div>
                    <div className="flex items-center mr-2">
                      <Badge
                        appearance={
                          props.rrfScore === undefined ? 'danger' : 'success'
                        }
                      >{`RRF scores: ${props.rrfScore.toFixed(10)}`}</Badge>
                    </div>
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
