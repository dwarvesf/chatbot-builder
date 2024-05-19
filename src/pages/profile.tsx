import { PageContent, PageHeader, PageHeaderTitle } from '@mochi-ui/core'
import type { GetServerSideProps, NextPage } from 'next'
import { SeoHead } from '~/components/common/SeoHead'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'
import { ProfilePage } from '~/components/Profile'

const Profile: NextPage = () => {
  return (
    <>
      <SeoHead title="Profile" />
      <PageHeader className="border-b border-divider">
        <PageHeaderTitle>Profile</PageHeaderTitle>
      </PageHeader>
      <PageContent>
        <ProfilePage />
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

  return { props: { session } }
}

export default Profile
