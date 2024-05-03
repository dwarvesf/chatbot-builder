import { Button, Card, IconButton, TextFieldInput } from "@mochi-ui/core";
import { CheckLine, EditLine, PlusLine, TrashBinLine } from "@mochi-ui/icons";
import { useParams } from 'next/navigation';
import { useState } from "react";
import { BotSourceTypeEnum } from '~/model/bot-source-type';
import { api } from '~/utils/api';

export const SourceLink = () => {
  const { id } = useParams()
  const [currentURL, setCurrentURL] = useState<string>("");
  const [urls, setUrls] = useState<string[]>([]);
  const [editingURL, setEditingURL] = useState<string>("");
  const [newURL, setNewURL] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { mutate: createSource, error: createError,  } = api.botSource.create.useMutation()

  const handleUploadTrain = () => {
    if (!id) return;
    urls.map((url: string) => {
      createSource({
        botId: id?.toString() || '',
        typeId: BotSourceTypeEnum.Link,
        url
      })
    })

    setUrls([])
  };
  const handleAddLink = () => {
    if (!currentURL) {
      return;
    }
    // validate valid url
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(currentURL)) {
      setError("Invalid URL");
      return;
    }
    
    // check if url already exists
    if (urls.includes(currentURL)) {
      setError("This link has already been added");
      return;
    }
    setUrls([...urls, currentURL]);

    setCurrentURL("");
    setError("");
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCurrentURL(value);
    if(!value) setError("");
  };

  const handleOnEditURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setNewURL(value);
  };

  const handleSaveEdit = () => {
    const index = urls.findIndex((url) => url === editingURL);
    urls[index] = newURL;
    setUrls([...urls]);
    setNewURL("");
    setEditingURL("");
  };

  const handleEdit = (url: string) => {
    if (!url || url === editingURL) return;
    setEditingURL(url);
    setNewURL(url);
  };

  const handleDelete = (url: string) => {
    const newUrls = urls.filter((u) => u !== url);
    setUrls(newUrls);
  };

  return (
    <div>
      <Card>
        <div className="items-center justify-center">
          <span className="text-sm text-gray-700">
            Enter a Website or Youtube video URL:
          </span>
          <div>
            {urls.map((url) => (
              <div key={url} className="flex justify-between p-1">
                <TextFieldInput
                  className="flex-1"
                  value={url === editingURL ? newURL : url}
                  disabled={url !== editingURL}
                  onChange={handleOnEditURL}
                />
                <div className="flex gap-2">
                  <IconButton
                    label="Edit"
                    color="white"
                    onClick={() => {
                      handleEdit(url)
                    }}
                  >
                    <EditLine height={20} width={20} />
                  </IconButton>
                  {url !== editingURL && (
                    <IconButton
                      label=""
                      color="white"
                      onClick={() => {
                        handleDelete(url)
                      }}
                    >
                      <TrashBinLine height={20} width={20} />
                    </IconButton>
                  )}
                  {url === editingURL && (
                    <IconButton
                      label=""
                      color="white"
                      onClick={() => {
                        handleSaveEdit()
                      }}
                    >
                      <CheckLine height={20} width={20} />
                    </IconButton>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-row items-center justify-between p-1">
            <TextFieldInput
              value={currentURL}
              className="grow max-w-max"
              onChange={handleOnChange}
              placeholder="Enter a website URL"
            />
            <Button onClick={handleAddLink}>
                <PlusLine height={20} width={20} />
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
};
