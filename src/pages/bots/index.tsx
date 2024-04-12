import { NextPage } from "next";
import { AuthenticatedLayout } from "~/components/layout";
import { SeoHead } from "~/components/SeoHead";
import { SiteHeader } from "~/components/SiteHeader";

const BotsPage: NextPage = () => {
  return (
    <>
      <SeoHead title="Your Bots" />
      <AuthenticatedLayout>
        <SiteHeader title="Your Bots" />
        <div>Bots Page</div>
      </AuthenticatedLayout>
    </>
  );
};

export default BotsPage;
