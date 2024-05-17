import { Typography } from '@mochi-ui/core'
import { SitemapSourceFile } from './SitemapSourceFile'
import { SitemapSourceLink } from './SitemapSourceLink'

export function SitemapSource() {
  return (
    <div className="space-y-3 mx-auto">
      <SitemapSourceLink />
      <div className="flex items-center gap-4">
        <div className="bg-divider h-px flex-1" />
        <Typography level="p4" color="textTertiary">
          or
        </Typography>
        <div className="bg-divider h-px flex-1" />
      </div>
      <SitemapSourceFile />
    </div>
  )
}
