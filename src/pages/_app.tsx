import { type Session } from 'next-auth'
import { SessionProvider, useSession } from 'next-auth/react'
import { type AppType } from 'next/app'
import { Inter } from 'next/font/google'

import { api } from '~/utils/api'

import React from 'react'
import { AuthenticatedLayout } from '~/components/layout'
import '~/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const InnerApp = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession()
  if (session) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  return <>{children}</>
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>
      <main className="font-sans">
        <InnerApp>
          <Component {...pageProps} />
        </InnerApp>
      </main>
    </SessionProvider>
  )
}

export default api.withTRPC(MyApp)
