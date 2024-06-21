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
  LogoWithText,
  Sidebar,
  TopBar,
  Typography,
  type SidebarProps,
} from '@mochi-ui/core'
import {
  DirectionLine,
  DollarBubbleSolid,
  EyeShowSolid,
  GearSolid,
  HomeSolid,
  InboxSolid,
  PlugSolid,
  UserSolid,
} from '@mochi-ui/icons'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { ROUTES } from '~/constants/routes'
import { api } from '~/utils/api'

type AuthLayoutProps = {
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
      Icon: GearSolid,
    },
    {
      title: 'Sources',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_SOURCES(botId),
      Icon: InboxSolid,
    },
    {
      title: 'Appearance',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_APPEARANCE(botId),
      Icon: EyeShowSolid,
    },
    {
      title: 'Integrations',
      type: 'link',
      as: Link,
      href: ROUTES.BOT_DETAIL_INTEGRATIONS(botId),
      Icon: PlugSolid,
    },
  ] as SidebarProps['headerItems']

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { pathname, query, asPath } = useRouter()
  const { id } = query
  const isBotPath = pathname.startsWith('/bots/[id]')
  const botId = id as string
  const botQuery = api.bot.getById.useQuery(botId, {
    enabled: isBotPath,
  })

  const { data: botLogo } = api.attachments.getById.useQuery(
    botQuery?.data?.botAvatarAttachmentId as string,
    {
      enabled:
        botQuery?.data?.botAvatarAttachmentId !== undefined &&
        botQuery?.data?.botAvatarAttachmentId !== null &&
        botQuery?.data?.botAvatarAttachmentId !== '',
    },
  )
  const profile = api.user.getUser.useQuery()

  const navItems = useMemo(
    () => [
      // eslint-disable-next-line react/jsx-key
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>
            {/* session?.data?.user.email */}
            <Avatar className="w-8 h-8" src={profile?.data?.image ?? ''} />
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
                {profile?.data?.name + ' ' + (profile?.data?.lastName ?? '')}
              </Typography>
              <Typography className="text-sm">
                {profile?.data?.email}
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
    [profile],
  )

  return (
    <Layout>
      <TopBar
        leftSlot={
          <Link href={ROUTES.HOME}>
            <LogoWithText
              logoProps={{ size: 'xs' }}
              className="!gap-2"
              textClassName="w-18 h-8"
            />
          </Link>
        }
        rightSlot={<DesktopNav navItems={navItems} />}
      />
      <Layout className="flex-1">
        <Sidebar
          Header={({ expanded }) => {
            if (!expanded || !isBotPath) {
              return <></>
            }
            return (
              <Link
                href={ROUTES.BOT_DETAIL(botId)}
                className="border-b px-8 h-[65px] flex items-center space-x-4"
              >
                <Avatar src={botLogo?.cloudPath ?? ''} />
                <Typography component="b" className="truncate">
                  {botQuery?.data?.name}
                </Typography>
              </Link>
            )
          }}
          isSelected={(item) => {
            return asPath === item.href
          }}
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
