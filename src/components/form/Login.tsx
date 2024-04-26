import { Button } from "@mochi-ui/core";
import { GoogleColored } from "@mochi-ui/icons";
import { signIn } from "next-auth/react";

const LoginForm = () => {
  return (
    <div className="mx-auto flex w-[300px] flex-col">
      <Button
        variant="outline"
        color="neutral"
        onClick={() => signIn("google")}
      >
        <div className="flex w-full items-center justify-between gap-4">
          Sign in with Google
          <GoogleColored width={24} height={24} />
        </div>
      </Button>
    </div>
  );
};

export default LoginForm;
