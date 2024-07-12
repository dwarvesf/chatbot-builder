import Head from 'next/head'

export type SeoHeadProps = {
  title?: string
  description?: string
}

export const SeoHead = (props: SeoHeadProps) => {
  const { title = 'Chatbot Builder', description = 'Chatbot Builder' } = props

  return (
    <Head>
      <title>{title}</title>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="description" content={description} />
    </Head>
  )
}
