/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Badge, type BadgeProps } from '@mochi-ui/core'
import { BotSourceTypeEnum } from '~/model/bot-source-type'

interface SourceTypeBadgeProps {
  typeId: number
}

const getTypeLabel = (typeId: number) => {
  switch (typeId) {
    case BotSourceTypeEnum.Link:
      return 'Link'
    case BotSourceTypeEnum.Sitemap:
      return 'Sitemap'
    default:
      return ''
  }
}

const getColor = (typeId: number): BadgeProps['appearance'] => {
  switch (typeId) {
    case BotSourceTypeEnum.Link:
      return 'primary'
    case BotSourceTypeEnum.Sitemap:
      return 'warning'
    default:
      return 'primary'
  }
}

export const SourceTypeBadge = ({ typeId }: SourceTypeBadgeProps) => {
  return <Badge appearance={getColor(typeId)}>{getTypeLabel(typeId)}</Badge>
}
