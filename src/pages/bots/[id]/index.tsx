import { TabContent, TabList, Tabs, TabTrigger } from '@mochi-ui/core'
import { type NextPage } from 'next'
import { useState } from 'react'
import { AuthenticatedLayout } from '~/components/layout'
import { SeoHead } from '~/components/SeoHead'
import { SiteHeader } from '~/components/SiteHeader'

export enum BotDetailTab {
  Sources = 'Sources',
  Settings = 'Settings',
}

const BotDetailPage: NextPage = () => {
  const [currentTab, setCurrentTab] = useState<BotDetailTab>(
    BotDetailTab.Sources,
  )

  return (
    <>
      <SeoHead title="Bot Name" />
      <AuthenticatedLayout>
        <Tabs defaultValue={currentTab}>
          <SiteHeader
            title="Bot Name"
            renderMiddle={() => {
              return (
                <TabList>
                  {Object.values(BotDetailTab).map((tab) => {
                    return (
                      <TabTrigger value={tab} key={tab}>
                        {tab}
                      </TabTrigger>
                    )
                  })}
                </TabList>
              )
            }}
          />
          <div className="flex-1 p-6">
            {Object.values(BotDetailTab).map((tab) => {
              return (
                <TabContent value={tab} key={tab}>
                  {tab}
                </TabContent>
              )
            })}
          </div>
        </Tabs>
      </AuthenticatedLayout>
    </>
  )
}

export default BotDetailPage
