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
    case BotSourceTypeEnum.SitemapFile:
    case BotSourceTypeEnum.File:
      return 'File'
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
    case BotSourceTypeEnum.File:
      return 'success'
    default:
      return 'primary'
  }
}

export const SourceTypeBadge = ({ typeId }: SourceTypeBadgeProps) => {
  return <Badge appearance={getColor(typeId)}>{getTypeLabel(typeId)}</Badge>
}
