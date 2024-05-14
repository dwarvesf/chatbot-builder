import { PageContent, PageHeader, PageHeaderTitle } from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const Billing: NextPage = () => {
  return (
    <>
      <SeoHead title="Billing" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Billing</PageHeaderTitle>
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

export default Billing
