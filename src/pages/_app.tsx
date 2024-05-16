import { type Session } from 'next-auth'
import { SessionProvider, useSession } from 'next-auth/react'
import { type AppType } from 'next/app'
import { Inter } from 'next/font/google'

import { api } from '~/utils/api'

import { Toaster } from '@mochi-ui/core'
import { ThreeDotLoading } from '@mochi-ui/icons'
import React from 'react'
import { AuthLayout } from '~/components/layout'
import '~/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const InnerApp = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <ThreeDotLoading className="w-20 h-20 text-primary-600" />
      </div>
    )
  }

  if (session) {
    return <AuthLayout>{children}</AuthLayout>
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
      <div className="fixed top-3 right-3 z-[999]">
        <Toaster duration={3000} />
      </div>
      <main className="font-sans">
        <InnerApp>
          <Component {...pageProps} />
        </InnerApp>
      </main>
    </SessionProvider>
  )
}

export default api.withTRPC(MyApp)
