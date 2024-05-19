/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAsyncEffect } from '@dwarvesf/react-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@mochi-ui/core'
import { useCallback, useEffect, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { ProfileName } from './ProfileName'
import { SaveBar } from '../SaveBar'

export interface Profile {
  firstName: string
  lastName: string
}

const schema = z.object({
  firstName: z.string().min(1).max(50, 'Max length is 50 characters.'),
  lastName: z.string().min(1).max(50, 'Max length is 50 characters.'),
})

export const ProfilePage = () => {
  const { data: sources, refetch: refetchProfile } = api.user.getUser.useQuery()
  const {
    mutate: updateProfile,
    error,
    isSuccess,
    isError,
    isPending,
  } = api.user.updateProfile.useMutation()

  const isInitialData = useRef(false)
  const { toast } = useToast()

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
      })
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

  const onSubmit = async (props: Profile) => {
    const payload: Profile = {
      firstName: props.firstName,
      lastName: props.lastName,
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
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} />

      <div className="min-h-screen max-w-[400px]">
        <ProfileName />
      </div>
      <SaveBar
        open={isDirty || isPending || isError}
        isLoading={isSubmitting || isPending}
        onConfirm={handleSubmit(onSubmit)}
        onCancel={() => reset()}
      />
    </FormProvider>
  )
}
