import type { GetServerSideProps, NextPage } from 'next'
import { SeoHead } from '~/components/common/SeoHead'
import LoginForm from '~/components/form/Login'
import BaseLayout from '~/components/layout/Layout'
import { ROUTES } from '~/constants/routes'
import { getServerAuthSession } from '~/server/auth'

const Login: NextPage = () => {
  return (
    <>
      <SeoHead title="Login" />
      <BaseLayout>
        <LoginForm />
      </BaseLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  })

  if (session) {
    return {
      redirect: {
        destination: ROUTES.HOME,
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default Login
