import { type PutBlobResult } from '@vercel/blob'
import { upload } from '@vercel/blob/client'
import { useRef, useState } from 'react'

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [blob, setBlob] = useState<PutBlobResult | null>(null)
  return (
    <>
      <h1>Upload Your Avatar</h1>

      <form
        onSubmit={async (event) => {
          event.preventDefault()

          if (!inputFileRef.current?.files) {
            throw new Error('No file selected')
          }

          const file = inputFileRef.current.files[0]
          if (!file) {
            throw new Error('No file selected')
          }

          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload-file',
          })

          setBlob(newBlob)
        }}
      >
        <input name="file" ref={inputFileRef} type="file" required />
        <button type="submit">Upload</button>
      </form>
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  )
}
