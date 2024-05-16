/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Badge, type BadgeProps } from '@mochi-ui/core'
import { BotSourceStatusEnum } from '~/model/bot-source-status'

interface SourceStatusBadgeProps {
  statusId: number
}

const getStatusLabel = (statusId: number) => {
  switch (statusId) {
    case BotSourceStatusEnum.Crawling:
      return 'Created'
    case BotSourceStatusEnum.Completed:
      return 'Completed'
    case BotSourceStatusEnum.Embedding:
      return 'Embedding'
    case BotSourceStatusEnum.Failed:
      return 'Failed'
    case BotSourceStatusEnum.Training:
      return 'Training'
    case BotSourceStatusEnum.InProgress:
      return 'In-progress'
    default:
      return 'Created'
  }
}

const getStatusColor = (statusId: number): BadgeProps['appearance'] => {
  switch (statusId) {
    case BotSourceStatusEnum.Crawling:
      return 'warning'
    case BotSourceStatusEnum.Completed:
      return 'success'
    case BotSourceStatusEnum.Embedding:
      return 'warning'
    case BotSourceStatusEnum.Failed:
      return 'danger'
    case BotSourceStatusEnum.Training:
      return 'warning'
    case BotSourceStatusEnum.InProgress:
      return 'neutral'
    default:
      return 'primary'
  }
}

export const SourceStatusBadge = ({ statusId }: SourceStatusBadgeProps) => {
  return (
    <Badge appearance={getStatusColor(statusId)}>
      {getStatusLabel(statusId)}
    </Badge>
  )
}
