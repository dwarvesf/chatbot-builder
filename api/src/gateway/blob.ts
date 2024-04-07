import { BlobSASPermissions, BlobServiceClient, HttpRequestBody } from '@azure/storage-blob';
import { AzureStorageConnectionString, AzureStorageContainerName } from '../config';

const blobServiceClient = BlobServiceClient.fromConnectionString(AzureStorageConnectionString);

export const azContainerClient = blobServiceClient.getContainerClient(AzureStorageContainerName);

export async function uploadFile(blobName: string, data: HttpRequestBody, contentLength: number) {
  const blockBlobClient = azContainerClient.getBlockBlobClient(blobName);
  return blockBlobClient.upload(data, contentLength);
}

export async function generateSasUrl(blobName: string) {
  const blockBlobClient = azContainerClient.getBlockBlobClient(blobName);
  return await blockBlobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });
}
