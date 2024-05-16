import {
  PageContent,
  PageHeader,
  PageHeaderTitle,
  TabContent,
  TabList,
  TabTrigger,
  Tabs,
} from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { LinkSource } from '~/components/BotSource/LinkSource'
import { SourceTable } from '~/components/BotSource/SourceTable'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const items = [
  {
    value: 'links',
    label: 'Links',
    render: <LinkSource />,
  },
  {
    value: 'sitemaps',
    label: 'Sitemaps',
  },
  {
    value: 'files-docs',
    label: 'Files/Docs',
  },
]

const BotSources: NextPage = () => {
  return (
    <>
      <SeoHead title="Sources" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Sources</PageHeaderTitle>
      </PageHeader>
      <PageContent className="bg-background-level1">
        <Tabs defaultValue="links">
          <TabList>
            {items.map((item) => (
              <TabTrigger
                className="!text-base"
                key={item.label}
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

        <SourceTable />
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

export default BotSources
