/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@mochi-ui/core'
import { useCallback, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '~/utils/api'
import { SaveBar } from '../SaveBar'
import { ProfileAvatar } from './ProfileAvatar'
import { ProfileName } from './ProfileName'
import { FormSkeleton } from '../common/FormSkeleton'

export interface ProfileForm {
  firstName: string
  lastName: string
  image: string
}

interface ProfileFormProps {
  defaultValues: ProfileForm
  onSuccess?: () => Promise<any>
}

const schema = z.object({
  firstName: z.string().min(1).max(50, 'Max length is 50 characters.'),
  lastName: z.string().min(1).max(50, 'Max length is 50 characters.'),
  image: z.string(),
})

const ProfileForm = ({ defaultValues, onSuccess }: ProfileFormProps) => {
  const { toast } = useToast()

  const {
    mutate: updateProfile,
    isError,
    isPending,
  } = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast({
        description: 'Update information successfully',
        scheme: 'success',
      })
      await onSuccess?.()
    },
    onError: (error) => {
      toast({
        description: 'Failed to update information',
        scheme: 'danger',
      })
      console.error(error)
    },
  })

  const form = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    mode: 'all',
    defaultValues,
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = form

  const resetData = useCallback(
    (data?: ProfileForm) => {
      if (!data) return
      reset({
        ...data,
      })
    },

    [reset],
  )

  const onSubmit = (props: ProfileForm) => {
    const payload: ProfileForm = {
      ...props,
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
  )
}

export const ProfilePage = () => {
  const {
    data: sources,
    refetch: refetchProfile,
    isPending,
  } = api.user.getUser.useQuery()

  const formDefaultValues = useMemo<ProfileForm | null>(() => {
    if (!sources) {
      return null
    }

    return {
      firstName: sources.name ?? '',
      lastName: sources.lastName ?? '',
      image: sources.image ?? '',
    }
  }, [sources])

  if (isPending || formDefaultValues === null) {
    return <FormSkeleton />
  }

  return (
    <ProfileForm defaultValues={formDefaultValues} onSuccess={refetchProfile} />
  )
}
