import { useMedia } from "@dwarvesf/react-hooks";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
  IconButton,
} from "@mochi-ui/core";
import React from "react";
import { Sidebar } from "../Sidebar";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
};

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const isMobile = useMedia(["(max-width: 512px)"], [true], false);

  return (
    <div className="flex min-h-screen">
      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>
            <IconButton label="Hi">Hi</IconButton>
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerOverlay />
            <DrawerContent>
              <Sidebar />
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
      ) : (
        <Sidebar />
      )}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
};
