import { Button } from "@mochi-ui/core";
import { GoogleColored } from "@mochi-ui/icons";
import { signIn } from "next-auth/react";

const LoginForm = () => {
  return (
    <Button
      variant="outline"
      color="neutral"
      onClick={() => signIn("google")}
      className="mx-auto w-full max-w-[300px] items-center justify-between"
    >
      Log in with Google
      <GoogleColored width={24} height={24} />
    </Button>
  );
};

export default LoginForm;
