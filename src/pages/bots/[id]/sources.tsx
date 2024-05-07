import { PageContent, PageHeader, PageHeaderTitle } from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { BotSource } from '~/components/BotSource'
import { SeoHead } from '~/components/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const BotSources: NextPage = () => {
  return (
    <>
      <SeoHead title="Sources" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Sources</PageHeaderTitle>
      </PageHeader>
      <PageContent className="!pt-2" containerClassName="!m-0 !max-w-none">
        <BotSource />
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
