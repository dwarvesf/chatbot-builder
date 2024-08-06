import { api } from '~/utils/api'

export default function DevPage() {
  const { data } = api.post.protectedHello.useQuery({ text: 'world' })

  const devPost = () => {
    console.log('data', data)
  }

  return (
    <div>
      <h1>Dev Page</h1>
      <p>
        This page is for development purposes. It is not included in the
        production build.
      </p>

      <button onClick={() => devPost()}>Click me</button>
    </div>
  )
}
