import type { GetServerSideProps, NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import { SeoHead } from "~/components/SeoHead";
import Layout from "~/components/layout/Layout";
import { ROUTES } from "~/constants/routes";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/utils/api";

const Dashboard: NextPage = () => {
  const session = useSession();
  const secret = api.post.getSecretMessage.useQuery();

  return (
    <>
      <SeoHead />
      <Layout>
        <div className="radius flex flex-col items-center gap-2 border p-4">
          <h1 className="text-lg">Dashboard - Protected</h1>
          <p>{JSON.stringify(session)}</p>
          <p>{secret.data ? secret.data : "Loading tRPC query..."}</p>
          <button
            onClick={() => signOut()}
            className="rounded border px-4 py-1"
          >
            Logout
          </button>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (!session) {
    return {
      redirect: {
        destination: ROUTES.HOME,
        permanent: false,
      },
    };
  }

  return { props: {} };
};

export default Dashboard;
