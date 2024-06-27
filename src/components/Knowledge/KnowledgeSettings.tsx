/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { Typography, useToast } from '@mochi-ui/core'
import { WebSolid, TwinkleSolid } from '@mochi-ui/icons'
import { useParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { SearchTypeEnum } from '~/model/search-type'
import { api } from '~/utils/api'
import { RetrievalSearchCard } from './RetrievalSearchCard'
import { SaveBar } from '../SaveBar'
import { useMemo } from 'react'

export interface RetrievalModelProps {
  botId: string
  retrievalModel: {
    search_method: SearchTypeEnum
    top_k: number
    distance: number
  }
}

interface KnowledgeSettingsProps {
  defaultValues: RetrievalModelProps
  onSuccess?: () => Promise<any>
}

const schema = z.object({
  botId: z.string(),
  retrievalModel: z.object({
    search_method: z.nativeEnum(SearchTypeEnum),
    top_k: z.number(),
    distance: z.number(),
  }),
})

const KnowledgeSettings = ({
  defaultValues,
  onSuccess,
}: KnowledgeSettingsProps) => {
  const { toast } = useToast()

  const form = useForm<RetrievalModelProps>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const {
    mutate: updateRetrievalModel,
    isError,
    isPending,
  } = api.botSource.setRetrievalModelBotSource.useMutation({
    onSuccess: async () => {
      toast({
        description: 'Update search method successful',
        scheme: 'success',
      })
      await onSuccess?.()
    },
    onError: (error) => {
      toast({
        description: 'Failed to update search method',
        scheme: 'danger',
      })
      console.error(error)
    },
  })

  const onSubmit = (props: RetrievalModelProps) => {
    const payload: RetrievalModelProps = { ...props }

    try {
      updateRetrievalModel(payload)
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
    reset(payload)
  }

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = form

  return (
    <div className="min-h-screen max-w-[80%] space-y-4 ">
      <div>
        <Typography level="h6" fontWeight="md">
          Knowledge settings
        </Typography>
        <Typography level="p5" fontWeight="md">
          Here you can modify the properties and working methods of the
          Knowledge.
        </Typography>
      </div>

      <div className="flex flex-row w-full">
        <div className="flex-col">
          <Typography>Retrieval setting</Typography>
          <Typography>Learn more about retrieval method.</Typography>
        </div>

        <div className="min-w-[80%]">
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="w-full flex flex-col space-y-8 min-h-screen">
                <RetrievalSearchCard
                  searchName="Vector Search"
                  description="Generate query embeddings and search for the text chunk most similar to its vector representation."
                  searchMethod={SearchTypeEnum.Vector}
                  Icon={TwinkleSolid}
                />

                <RetrievalSearchCard
                  searchName="Full-Text Search"
                  description="Index all terms in the document, allowing users to search any term and retrieve relevant text chunk containing those terms."
                  searchMethod={SearchTypeEnum.FullText}
                  Icon={WebSolid}
                />

                <SaveBar
                  open={isDirty || isPending || isError}
                  isLoading={isSubmitting || isPending}
                  onConfirm={handleSubmit(onSubmit)}
                  onCancel={() => reset()}
                />
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}

export const KnowledgeSettingsPage = () => {
  const { id } = useParams() ?? {}

  const {
    data: sources,
    refetch,
    isPending,
  } = api.botSource.getRetrievalModelByBotSourceId.useQuery({
    botId: id as string,
  })

  const formDefaultValues = useMemo<RetrievalModelProps | null>(() => {
    if (!sources) {
      return null
    }

    return {
      botId: id as string,
      retrievalModel: {
        search_method: sources.search_method ?? SearchTypeEnum.Vector,
        top_k: sources.top_k ?? 2,
        distance: sources.distance ?? 0.5,
      },
    }
  }, [sources])

  if (isPending || formDefaultValues === null) {
    return (
      <Typography level="h6" fontWeight="lg">
        Please create your Knowledge
      </Typography>
    )
  }

  return (
    <KnowledgeSettings defaultValues={formDefaultValues} onSuccess={refetch} />
  )
}
