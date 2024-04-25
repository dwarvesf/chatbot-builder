import { signIn } from "next-auth/react";


const LoginForm = () => {
  return (
    <div className="radius flex flex-col items-center gap-2 border p-4">
      <div>
        <button onClick={() => signIn('google')}>sign in with gooogle</button>
      </div>
    </div>
  );
};

export default LoginForm;
