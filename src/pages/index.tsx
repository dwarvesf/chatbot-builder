import { type NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { SeoHead } from "~/components/SeoHead";
import Layout from "~/components/layout/Layout";
import { ROUTES } from "~/constants/routes";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const hello = api.post.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <SeoHead />
      <Layout>
        <div className="radius flex flex-col items-center gap-2 border p-4">
          <h1 className="text-lg">Home - Not protected</h1>
          <p>
            {session ? "You are authenticated" : "You are not authenticated"}
          </p>
          {session && (
            <div className="flex flex-row gap-2">
              <Link href={"/dashboard"} className="rounded border px-4 py-1">
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded border px-4 py-1"
              >
                Logout
              </button>
            </div>
          )}

          {!session && (
            <div className="flex flex-row gap-2">
              <Link href={ROUTES.LOGIN} className="rounded border px-4 py-1">
                Login
              </Link>
              <Link href={"/register"} className="rounded border px-4 py-1">
                Register
              </Link>
            </div>
          )}
          <p>{hello.data ? hello.data.greeting : "Loading tRPC query..."}</p>
        </div>
      </Layout>
    </>
  );
};

export default Home;
