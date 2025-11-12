"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Eye,
  Download,
  Trash2
} from "lucide-react"

interface FileUploadProps {
  onUploadComplete?: (dataset: any) => void
}

interface UploadFile {
  file: File
  id: string
  name: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  dataset?: any
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [datasetName, setDatasetName] = useState("")
  const [datasetDescription, setDatasetDescription] = useState("")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    // Process each file
    newFiles.forEach(uploadFile => {
      handleFileUpload(uploadFile)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json', '.jsonl'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  })

  const handleFileUpload = async (uploadFile: UploadFile) => {
    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('name', datasetName || uploadFile.file.name.replace(/\.[^/.]+$/, ""))
      formData.append('description', datasetDescription)

      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ))
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { 
                  ...f, 
                  status: 'processing', 
                  progress: 100,
                  dataset: response 
                } 
              : f
          ))

          // Simulate processing
          setTimeout(() => {
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'completed' } 
                : f
            ))
            
            if (onUploadComplete) {
              onUploadComplete(response)
            }
          }, 3000)
        } else {
          const error = JSON.parse(xhr.responseText)
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'failed', error: error.error } 
              : f
          ))
        }
      }

      xhr.onerror = () => {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'failed', error: 'Network error' } 
            : f
        ))
      }

      xhr.open('POST', '/api/upload', true)
      xhr.send(formData)

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'failed', error: 'Upload failed' } 
          : f
      ))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500" />
      case 'processing':
        return <Database className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>
      case 'processing':
        return <Badge variant="outline">Processing</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Dataset Info */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
          <CardDescription>
            Provide details about your dataset for better organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Dataset Name</label>
            <Input
              placeholder="Enter dataset name"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
            <Textarea
              placeholder="Describe your dataset content and purpose"
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Dataset</CardTitle>
          <CardDescription>
            Upload your training data in JSONL, CSV, or TXT format. Maximum file size: 100MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports JSONL, CSV, and TXT files up to 100MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(file.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="w-full" />
                  )}

                  {file.status === 'processing' && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Processing dataset...</span>
                    </div>
                  )}

                  {file.status === 'failed' && file.error && (
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{file.error}</span>
                    </div>
                  )}

                  {file.status === 'completed' && file.dataset && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-1 font-medium">{file.dataset.format}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Records:</span>
                        <span className="ml-1 font-medium">{file.dataset.recordCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-1 font-medium">{file.dataset.fileSize} MB</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">JSONL</h4>
              <p className="text-sm text-gray-600 mb-2">
                JSON Lines format - one JSON object per line
              </p>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                {`{"prompt": "Hello", "completion": "Hi there!"}`}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">CSV</h4>
              <p className="text-sm text-gray-600 mb-2">
                Comma-separated values with header row
              </p>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                prompt,completion<br/>
                "Hello","Hi there!"
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">TXT</h4>
              <p className="text-sm text-gray-600 mb-2">
                Plain text files, one record per line
              </p>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                Hello world<br/>
                This is a sample
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}