import { Avatar, ProfileBadge } from "@mochi-ui/core";
import Head from "next/head";

export type SiteHeaderProps = {
  title?: string;
  renderMiddle?: () => React.ReactNode;
};

export const SiteHeader = (props: SiteHeaderProps) => {
  const { title, renderMiddle } = props;

  return (
    <header className="flex min-h-[64px] items-center justify-between gap-4 border-b px-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {renderMiddle?.()}
      <div>
        <ProfileBadge name="John Doe" avatar="" platform="" />
      </div>
    </header>
  );
};
