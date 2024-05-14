import { PageContent, PageHeader, PageHeaderTitle } from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { BotSetting } from '~/components/BotSetting'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const BotSettings: NextPage = () => {
  return (
    <>
      <SeoHead title="Settings" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Settings</PageHeaderTitle>
      </PageHeader>
      <PageContent>
        <BotSetting />
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

export default BotSettings
