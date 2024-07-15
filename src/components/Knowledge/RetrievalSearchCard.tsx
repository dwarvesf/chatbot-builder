/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Typography, Badge, FormControl, Tooltip } from '@mochi-ui/core'
import { AlertCircleLine } from '@mochi-ui/icons'
import clsx from 'clsx'
import { Controller, useFormContext } from 'react-hook-form'
import { SearchTypeEnum } from '~/model/search-type'
import { type RetrievalModelProps } from './KnowledgeSettings'
import { useId } from 'react'

interface RetrievalSearchProps {
  searchName: string
  description: string
  searchMethod: SearchTypeEnum
  recommended?: boolean
  Icon?: (props: any) => JSX.Element
}

export const RetrievalSearchCard = ({
  searchName,
  description,
  searchMethod,
  recommended = false,
  Icon,
}: RetrievalSearchProps) => {
  const id = useId()
  const { control, watch, setValue } = useFormContext<RetrievalModelProps>()
  const currentSearchMethod = watch('retrievalModel.searchMethod')

  const isSelected = currentSearchMethod === searchMethod

  const handleSelectSearchMethod = () => {
    setValue('retrievalModel.searchMethod', searchMethod, {
      shouldDirty: true,
    })
  }

  return (
    <label htmlFor={id}>
      <Card
        className={clsx(
          'bg-white p-8 rounded-lg shadow-md border-2 hover:border-indigo-300',
          {
            ' border-indigo-600': isSelected,
          },
        )}
      >
        <div className="flex flex-row space-x-4">
          {Icon && <Icon className="w-12 h-12 text-indigo-700" />}
          <div className="flex flex-col space-y-2">
            <div className="flex flex-row mb-4">
              <div className="flex flex-col">
                <div className="flex flex-row items-stretch space-x-2">
                  <Typography level="h6" fontWeight="lg">
                    {searchName}
                  </Typography>
                  {recommended && (
                    <Badge appearance="secondary" className="p-2">
                      Recommend
                    </Badge>
                  )}
                </div>
                <Typography level="p5">{description}</Typography>
              </div>

              <input
                type="radio"
                id={id}
                checked={isSelected}
                onChange={handleSelectSearchMethod}
                className="hidden peer"
              />
            </div>

            {isSelected && (
              <div className="mb-4 gap-4 grid grid-cols-2">
                <div className="grid grid-col-1">
                  <div className="flex flex-row space-x-2">
                    <Typography level="h6" fontWeight="lg">
                      Top K
                    </Typography>
                    <Tooltip
                      arrow="top-center"
                      className="w-60 h-auto text-pretty"
                      content="Used to filter chunks that are most similar to user questions. The system will also dynamically adjust the value of Top K, according to max_tokens of the selected model."
                    >
                      <AlertCircleLine className="h-4 w-4" />
                    </Tooltip>
                  </div>

                  <Controller
                    control={control}
                    name="retrievalModel.topK"
                    render={({ field }) => (
                      <FormControl hideHelperTextOnError>
                        <div className="flex flex-row space-x-4 items-baseline">
                          <Typography
                            level="p5"
                            fontWeight="lg"
                            className="px-2"
                          >
                            {field.value ?? 1}
                          </Typography>
                          <input
                            type="range"
                            defaultValue={1}
                            min={1}
                            max={20}
                            step={1}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </div>
                      </FormControl>
                    )}
                  />
                </div>

                {searchMethod === SearchTypeEnum.FullText ? null : (
                  <div className="grid grid-col-1">
                    <div className="flex flex-row space-x-2">
                      <Typography level="h6" fontWeight="lg">
                        Score Threshold
                      </Typography>
                      <Tooltip
                        arrow="top-center"
                        className="w-40 h-auto text-pretty"
                        content="Used to set the similarity threshold for chunks filtering."
                      >
                        <AlertCircleLine className="h-4 w-4" />
                      </Tooltip>
                    </div>

                    <Controller
                      control={control}
                      name="retrievalModel.similarityThreshold"
                      render={({ field }) => (
                        <FormControl hideHelperTextOnError>
                          <div className="flex flex-row space-x-4 items-baseline">
                            <Typography
                              level="p5"
                              fontWeight="lg"
                              className="px-2"
                            >
                              {field.value ?? 0}
                            </Typography>
                            <input
                              type="range"
                              defaultValue={0}
                              min={0}
                              max={1}
                              step={0.01}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                      )}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </label>
  )
}
