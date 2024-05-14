import { Button, Card, Logo, Typography } from '@mochi-ui/core'
import { GoogleColored } from '@mochi-ui/icons'
import { signIn } from 'next-auth/react'

const LoginForm = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 pt-5 pb-20">
      <Card className="min-w-[400px] shadow flex flex-col items-center pb-10 py-8">
        <Logo />
        <Typography
          className="text-3xl mt-4 mb-1 text-text-primary"
          component="h4"
        >
          Welcome
        </Typography>
        <Typography className="mb-5 text-text-tertiary">
          Sign in or sign up to continue
        </Typography>
        <Button
          variant="outline"
          color="neutral"
          onClick={() => signIn('google')}
          className="mx-auto w-full max-w-[300px] items-center justify-between"
        >
          Continue with Google
          <GoogleColored width={24} height={24} />
        </Button>
      </Card>
    </div>
  )
}

export default LoginForm
