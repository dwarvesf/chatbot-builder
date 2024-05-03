/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import {
  Avatar,
  DesktopNav,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Layout,
  Sidebar,
  TopBar,
  Typography,
  type SidebarProps,
} from '@mochi-ui/core'
import {
  DirectionLine,
  DollarBubbleSolid,
  HomeSolid,
  UserSolid,
} from '@mochi-ui/icons'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { ROUTES } from '~/constants/routes'

type AuthenticatedLayoutProps = {
  children: React.ReactNode
}

const headerMainItems: SidebarProps['headerItems'] = [
  {
    title: 'Dashboard',
    type: 'link',
    as: Link,
    href: ROUTES.HOME,
    Icon: HomeSolid,
  },
]

const headerBotItems = (botId: string) =>
  [
    {
      title: 'Settings',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_SETTINGS(botId),
      Icon: HomeSolid,
    },
    {
      title: 'Sources',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_SOURCES(botId),
      Icon: HomeSolid,
    },
    {
      title: 'Appearance',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_APPEARANCE(botId),
      Icon: HomeSolid,
    },
    {
      title: 'Integration',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_INTEGRATIONS(botId),
      Icon: HomeSolid,
    },
  ] as SidebarProps['headerItems']

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const session = useSession()
  const { pathname, query } = useRouter()
  const { id } = query
  const isBotPath = pathname.startsWith('/bots/[id]')

  const navItems = useMemo(
    () => [
      // eslint-disable-next-line react/jsx-key
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>
            <Avatar className="w-8 h-8" src={session.data?.user.image ?? ''} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            wrapperClassName="z-[60]"
            className="flex h-[calc(100svh-56px)] w-screen flex-col overflow-y-auto rounded-none lg:m-0 lg:block lg:h-auto lg:max-h-[calc(100svh-100px)] lg:w-auto lg:rounded-lg"
            sideOffset={9}
            collisionPadding={{
              right: 32,
              bottom: 32,
            }}
          >
            <div className="px-3 py-1">
              <Typography className="text-sm" component="b">
                {session.data?.user.name}
              </Typography>
              <Typography className="text-sm">
                {session.data?.user.email}
              </Typography>
            </div>
            <DropdownMenuSeparator />
            <Link href={ROUTES.PROFILE}>
              <DropdownMenuItem leftIcon={<UserSolid />}>
                Profile
              </DropdownMenuItem>
            </Link>

            <Link href={ROUTES.BILLING}>
              <DropdownMenuItem leftIcon={<DollarBubbleSolid />}>
                Billing
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <a onClick={() => signOut()}>
              <DropdownMenuItem leftIcon={<DirectionLine />}>
                Logout
              </DropdownMenuItem>
            </a>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>,
    ],
    [session],
  )

  return (
    <Layout>
      <TopBar
        leftSlot={
          <Link href={ROUTES.HOME}>
            <Typography className="!text-sm font-semibold">APP LOGO</Typography>
          </Link>
        }
        rightSlot={<DesktopNav navItems={navItems} />}
      />
      <Layout className="flex-1">
        <Sidebar
          version="0.0.1"
          headerItems={
            isBotPath
              ? headerBotItems(id?.toString() as string)
              : headerMainItems
          }
          className="!h-[calc(100vh-56px)]"
        />
        <Layout className="h-[calc(100vh-56px)] w-10 flex-1">{children}</Layout>
      </Layout>
    </Layout>
  )
}
