import {
  PageContent,
  PageHeader,
  PageHeaderTitle,
  TabContent,
  TabList,
  Tabs,
  TabTrigger,
} from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { SeoHead } from '~/components/common/SeoHead'
import { KnowledgeSearch } from '~/components/Knowledge/KnowledgeSearch'
import { KnowledgeSettingsPage } from '~/components/Knowledge/KnowledgeSettings'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const items = [
  {
    value: 'search',
    label: 'Search',
    render: <KnowledgeSearch />,
  },
  {
    value: 'settings',
    label: 'Settings',
    render: <KnowledgeSettingsPage />,
  },
]

const Knowledge: NextPage = () => {
  return (
    <>
      <SeoHead title="Knowledge" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Knowledge</PageHeaderTitle>
      </PageHeader>
      <PageContent className="bg-background-level2">
        <Tabs defaultValue="search">
          <TabList>
            {items.map((item) => (
              <TabTrigger
                key={item.label}
                className="!text-base"
                value={item.value}
              >
                {item.label}
              </TabTrigger>
            ))}
          </TabList>

          <div className="border-b border-divider" />

          <div className="mt-5">
            {items.map((item) => (
              <TabContent key={item.label} value={item.value}>
                {item.render}
              </TabContent>
            ))}
          </div>
        </Tabs>
      </PageContent>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  })

  if (!session) {
    return {
      redirect: {
        destination: ROUTES.LOGIN,
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default Knowledge
