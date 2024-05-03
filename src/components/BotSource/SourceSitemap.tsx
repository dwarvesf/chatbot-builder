import { Button, Card, IconButton, TextFieldInput } from '@mochi-ui/core'
import { ShareSolid, TrashBinLine } from '@mochi-ui/icons'
import { useState } from 'react'
import FileInput from '../FileInput/FileInput'

export const SourceSitemap = () => {
  const [currentURL, setCurrentURL] = useState<string>('')
  const [urls, setUrls] = useState<string[]>([])
  const [editingURL, setEditingURL] = useState<string>('')
  const [newURL, setNewURL] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [files, setFiles] = useState<FileList | null>(null)
  

  const handleUploadTrain = () => {
    // TODO: upload and train
  }
  const findSitemapURL = async (url: string) => {
    // TODO: Implement findSitemapURL function
    return null
  }
  const handleAddLink = async () => {
    if (!currentURL) {
      return
    }
    // validate valid url
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    if (!urlRegex.test(currentURL)) {
      setError('Invalid URL')
      return
    }
    // find sitemap url of the url
    const siteMap = await findSitemapURL(currentURL)
    if (!siteMap) {
      setError('No sitemap found for this URL')
      return
    }
    setLoading(true)
    // call api to get sitemap

    setCurrentURL('')
    setError('')
    setLoading(false)
  }

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setCurrentURL(value)
    if (!value) setError('')
  }

  const handleDelete = (file: File) => {
    if (!file || !files) {
      return
    }
    // delete file in files
    const newFiles = Object.values(files).filter((f) => f.name !== file.name)
    const dataTransfer = new DataTransfer()
    newFiles.forEach((file) => {
      dataTransfer.items.add(file)
    })
    setFiles(dataTransfer.files)
  }

  const handleSelectFiles = (selectedFiles: FileList) => {
    setFiles(selectedFiles)
  }

  return (
    <div>
      <div className="pb-4">
        <div className="flex pb-4 justify-between items-center">
          <div className="flex-1 w-fit">
            <span className="flex font-bold">Upload URLs in bulk</span>
            <span className="text-gray-500 text-sm">
              Download our template, add all URLs in the sheet, and upload
              instantly.
            </span>
          </div>
          <div className="flex justify-center">
            <ShareSolid width={20} height={20} className="text-blue-500" />
            <span className="text-blue-500">Template</span>
          </div>
        </div>
        <FileInput onFilesSelect={handleSelectFiles} />
        {files && (
          <div className="flex flex-col p-1">
            {Object.values(files).map((file: File) => (
              <div className="flex justify-between items-center" key={file.name}>
                <span key={file.name} className="text-sm text-gray-700">
                  {file.name}
                </span>
                  <IconButton
                    label=""
                    color="white"
                    onClick={() => {
                      handleDelete(file)
                    }}
                  >
                    <TrashBinLine height={20} width={20} />
                  </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card>
        <div className="items-center justify-center">
          <span className="text-sm text-gray-700">Enter a Website URL:</span>
          <div className="flex flex-row items-center justify-between p-1">
            <TextFieldInput
              value={currentURL}
              className="flex w-max"
              onChange={handleOnChange}
              placeholder="Enter a website URL"
            />
            <Button onClick={handleAddLink} loading={loading}>
              Get Sitemap
            </Button>
          </div>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </Card>
      <div className="flex items-center justify-center pt-4">
        <Button className="p-3" onClick={() => handleUploadTrain()}>
          Upload and Train
        </Button>
      </div>
    </div>
  )
}
