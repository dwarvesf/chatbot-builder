import { PageContent, PageHeader, PageHeaderTitle } from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { SeoHead } from '~/components/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const Setting: NextPage = () => {
  return (
    <>
      <SeoHead title="Setting" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Settings</PageHeaderTitle>
      </PageHeader>
      <PageContent>...</PageContent>
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

export default Setting
