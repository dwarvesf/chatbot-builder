import {
  DesktopNav,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Layout,
  ProfileBadge,
  Sidebar,
  TopBar,
  Typography,
  type SidebarProps,
} from '@mochi-ui/core'
import { DirectionLine, GearSolid, HomeSolid, UserSolid } from '@mochi-ui/icons'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import React, { useMemo } from 'react'
import { ROUTES } from '~/constants/routes'

type AuthenticatedLayoutProps = {
  children: React.ReactNode
}

const headerItems: SidebarProps['headerItems'] = [
  {
    title: 'Dashboard',
    type: 'link',
    as: Link,
    href: ROUTES.HOME,
    Icon: HomeSolid,
  },
  {
    title: 'Settings',
    type: 'link',
    as: Link,
    href: ROUTES.SETTINGS,
    Icon: GearSolid,
  },
]

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const session = useSession()

  const navItems = useMemo(
    () => [
      // eslint-disable-next-line react/jsx-key
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ProfileBadge
            avatar={session.data?.user.image ?? ''}
            name={session.data?.user.name ?? ''}
            platform=""
          />
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
            <Link href={ROUTES.PROFILE}>
              <DropdownMenuItem leftIcon={<UserSolid />}>
                Profile
              </DropdownMenuItem>
            </Link>

            <Link href={ROUTES.SETTINGS}>
              <DropdownMenuItem leftIcon={<GearSolid />}>
                Settings
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
          <Typography className="!text-sm font-semibold">APP LOGO</Typography>
        }
        rightSlot={<DesktopNav navItems={navItems} />}
      />
      <Layout className="flex-1">
        <Sidebar
          version="0.0.1"
          headerItems={headerItems}
          className="!h-[calc(100vh-56px)]"
        />
        <Layout className="h-[calc(100vh-56px)] w-10 flex-1">{children}</Layout>
      </Layout>
    </Layout>
  )
}
