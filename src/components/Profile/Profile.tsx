/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { Skeleton, useToast } from '@mochi-ui/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { SaveBar } from '../SaveBar'
import { ProfileAvatar } from './ProfileAvatar'
import { ProfileName } from './ProfileName'

export interface Profile {
  firstName: string
  lastName: string
  image: string
}

const schema = z.object({
  firstName: z.string().min(1).max(50, 'Max length is 50 characters.'),
  lastName: z.string().min(1).max(50, 'Max length is 50 characters.'),
  image: z.string(),
})

export const ProfilePage = () => {
  const isInitialData = useRef(false)
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false)
  const { toast } = useToast()

  const {
    mutate: updateProfile,
    error,
    isSuccess,
    isError,
    isPending,
  } = api.user.updateProfile.useMutation()

  const { data: sources, refetch: refetchProfile } = api.user.getUser.useQuery()

  const form = useForm<Profile>({
    resolver: zodResolver(schema),
    mode: 'all',
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = form

  const resetData = useCallback(
    (data?: Profile) => {
      if (!data) return
      reset({
        ...data,
      })
    },

    [reset],
  )

  useEffect(() => {
    if (sources && !isInitialData.current) {
      isInitialData.current = true
      reset({
        firstName: sources.firstName!,
        lastName: sources.lastName!,
        image: sources.image!,
      })
      setIsFetchingData(true)
    }
  }, [sources])

  useAsyncEffect(async () => {
    if (isSuccess) {
      toast({
        description: 'Update information successfully',
        scheme: 'success',
      })
      await refetchProfile()
    }
    if (isError) {
      toast({
        description: 'Failed to update information',
        scheme: 'danger',
      })
      console.error(error)
    }
  }, [isSuccess, isError, error])

  const onSubmit = (props: Profile) => {
    const payload: Profile = {
      firstName: props.firstName,
      lastName: props.lastName,
      image: props.image,
    }

    try {
      updateProfile(payload)
    } catch (error: any) {
      toast({
        description: error?.message ?? '',
        scheme: 'danger',
      })
    }
    resetData(payload)
  }

  return (
    <div>
      {isFetchingData ? (
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} />
          <div className="min-h-screen max-w-[400px] space-y-8">
            <ProfileName />
            <ProfileAvatar />
          </div>
          <SaveBar
            open={isDirty || isPending || isError}
            isLoading={isSubmitting || isPending}
            onConfirm={handleSubmit(onSubmit)}
            onCancel={() => reset()}
          />
        </FormProvider>
      ) : (
        <div className="min-h-screen max-w-[400px] space-y-8 animate-pulse">
          <div className="flex flex-col w-full relative items-stretch overflow-hidden rounded gap-12">
            <div className="flex flex-col w-full gap-4">
              <Skeleton className="w-2/5 h-4 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
            </div>

            <div className="flex flex-col w-full gap-4">
              <Skeleton className="w-2/5 h-4 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
            </div>
          </div>

          <div className="flex flex-row w-full relative items-stretch overflow-hidden rounded gap-4">
            <div className="flex items-center gap-3 w-full">
              <div>
                <Skeleton className="flex w-[64px] h-[64px] rounded-full" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <Skeleton className="w-3/5 h-4 rounded-lg" />
                <Skeleton className="w-4/5 h-4 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
