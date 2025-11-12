import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const bucketName = process.env.AWS_S3_BUCKET || 'ai-models-storage'

export interface FileUploadOptions {
  fileName: string
  contentType: string
  content: Buffer | string
  metadata?: Record<string, string>
}

export interface FileDownloadOptions {
  key: string
  expiresIn?: number
}

export interface StorageFile {
  key: string
  fileName: string
  size: number
  contentType: string
  etag: string
  location: string
  metadata?: Record<string, string>
  createdAt: Date
}

export class CloudStorageService {
  private bucketName: string

  constructor(bucketName?: string) {
    this.bucketName = bucketName || process.env.AWS_S3_BUCKET || 'ai-models-storage'
  }

  async uploadFile(options: FileUploadOptions): Promise<StorageFile> {
    try {
      const { fileName, contentType, content, metadata = {} } = options

      // Generate unique key
      const fileExtension = fileName.split('.').pop()
      const uniqueKey = `${randomUUID()}.${fileExtension}`

      // Prepare upload command
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueKey,
        Body: content,
        ContentType: contentType,
        Metadata: {
          originalFileName: fileName,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      })

      // Upload file
      const result = await s3Client.send(uploadCommand)

      const storageFile: StorageFile = {
        key: uniqueKey,
        fileName,
        size: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
        contentType,
        etag: result.ETag || '',
        location: `s3://${this.bucketName}/${uniqueKey}`,
        metadata,
        createdAt: new Date(),
      }

      return storageFile
    } catch (error) {
      console.error('Error uploading file to S3:', error)
      throw new Error('Failed to upload file to cloud storage')
    }
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      throw new Error('Failed to generate presigned URL')
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await s3Client.send(deleteCommand)
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      throw new Error('Failed to delete file from cloud storage')
    }
  }

  async getFileMetadata(key: string): Promise<Partial<StorageFile>> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const result = await s3Client.send(command)
      
      return {
        key,
        fileName: result.Metadata?.originalFileName || key,
        size: result.ContentLength || 0,
        contentType: result.ContentType || '',
        etag: result.ETag || '',
        location: `s3://${this.bucketName}/${key}`,
        metadata: result.Metadata as Record<string, string>,
        createdAt: new Date(result.LastModified || Date.now()),
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  async getFileContent(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const result = await s3Client.send(command)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        if (result.Body) {
          ;(result.Body as any).on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })

          ;(result.Body as any).on('end', () => {
            resolve(Buffer.concat(chunks))
          })

          ;(result.Body as any).on('error', (error: Error) => {
            reject(error)
          })
        } else {
          reject(new Error('File content not found'))
        }
      })
    } catch (error) {
      console.error('Error getting file content:', error)
      throw new Error('Failed to get file content')
    }
  }

  // Utility methods for specific file types
  async uploadDatasetFile(
    fileName: string,
    content: Buffer | string,
    userId: string,
    datasetId?: string
  ): Promise<StorageFile> {
    return this.uploadFile({
      fileName,
      contentType: this.getContentType(fileName),
      content,
      metadata: {
        userId,
        type: 'dataset',
        datasetId: datasetId || '',
      },
    })
  }

  async uploadModelFile(
    fileName: string,
    content: Buffer | string,
    userId: string,
    modelId?: string
  ): Promise<StorageFile> {
    return this.uploadFile({
      fileName,
      contentType: this.getContentType(fileName),
      content,
      metadata: {
        userId,
        type: 'model',
        modelId: modelId || '',
      },
    })
  }

  async uploadLogFile(
    fileName: string,
    content: Buffer | string,
    userId: string,
    jobId?: string
  ): Promise<StorageFile> {
    return this.uploadFile({
      fileName,
      contentType: this.getContentType(fileName),
      content,
      metadata: {
        userId,
        type: 'log',
        jobId: jobId || '',
      },
    })
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'json':
        return 'application/json'
      case 'jsonl':
        return 'application/jsonl'
      case 'csv':
        return 'text/csv'
      case 'txt':
        return 'text/plain'
      case 'pdf':
        return 'application/pdf'
      case 'zip':
        return 'application/zip'
      case 'tar':
        return 'application/x-tar'
      case 'gz':
        return 'application/gzip'
      case 'py':
        return 'text/x-python'
      case 'js':
        return 'application/javascript'
      case 'ts':
        return 'application/typescript'
      case 'md':
        return 'text/markdown'
      default:
        return 'application/octet-stream'
    }
  }
}

// Export singleton instance
export const cloudStorageService = new CloudStorageService()