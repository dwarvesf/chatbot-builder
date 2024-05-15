import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const body = request.body as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        let maxSize = 5000000000 // 5GB
        if (
          pathname.includes(
            '.jpg' || '.jpeg' || '.png' || '.gif' || '.webp' || '.svg',
          )
        ) {
          maxSize = 50000000 // 50MB
        }

        return {
          maximumSizeInBytes: maxSize,
          tokenPayload: JSON.stringify({}),
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onUploadCompleted: async () => {},
    })

    return response.status(200).json(jsonResponse)
  } catch (error) {
    // The webhook will retry 5 times waiting for a 200
    return response.status(400).json({ error: (error as Error).message })
  }
}
