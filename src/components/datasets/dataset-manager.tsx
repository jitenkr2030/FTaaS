"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/upload/file-upload"
import { useToast } from "@/hooks/use-toast"
import { 
  Database, 
  Upload, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  BarChart3
} from "lucide-react"

interface Dataset {
  id: string
  name: string
  description: string
  fileName: string
  fileSize: number
  format: string
  recordCount: number
  status: "READY" | "PROCESSING" | "UPLOADING" | "FAILED"
  createdAt: string
  lastModified: string
  tags: string[]
  preview: any[]
  error?: string
  progress?: number
}

export function DatasetManager() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedFormat, setSelectedFormat] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchDatasets()
  }, [selectedStatus, selectedFormat, searchTerm])

  const fetchDatasets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append('status', selectedStatus)
      }
      if (selectedFormat !== "all") {
        params.append('format', selectedFormat)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/datasets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDatasets(data)
      } else {
        throw new Error('Failed to fetch datasets')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || dataset.status === selectedStatus
    const matchesFormat = selectedFormat === "all" || dataset.format === selectedFormat
    
    return matchesSearch && matchesStatus && matchesFormat
  })

  const formats = ["all", ...new Set(datasets.map(d => d.format))]
  const statuses = ["all", "READY", "PROCESSING", "UPLOADING", "FAILED"]

  const handlePreviewDataset = async (datasetId: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/preview`)
      if (response.ok) {
        const preview = await response.json()
        toast({
          title: "Dataset Preview",
          description: "Preview loaded successfully.",
        })
        // In a real app, you would show the preview in a modal or navigate to a details page
      } else {
        throw new Error('Failed to load preview')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dataset preview. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditDataset = async (datasetId: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'edit' }),
      })

      if (response.ok) {
        toast({
          title: "Dataset Updated",
          description: "Dataset information has been updated successfully.",
        })
        fetchDatasets() // Refresh the list
      } else {
        throw new Error('Failed to update dataset')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update dataset. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDataset = async (datasetId: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dataset-${datasetId}.jsonl`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Download Started",
          description: "Dataset download has been initiated.",
        })
      } else {
        throw new Error('Failed to download dataset')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download dataset. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Dataset Deleted",
          description: "Dataset has been deleted successfully.",
        })
        fetchDatasets() // Refresh the list
      } else {
        throw new Error('Failed to delete dataset')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUploadComplete = (dataset: any) => {
    toast({
      title: "Upload Complete",
      description: "Dataset has been uploaded successfully.",
    })
    fetchDatasets() // Refresh the list
  }

  const getStatusBadge = (status: string, progress?: number) => {
    switch (status) {
      case "READY":
        return <Badge variant="default" className="bg-green-500">Ready</Badge>
      case "PROCESSING":
        return <Badge variant="secondary">Processing</Badge>
      case "UPLOADING":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">Uploading</Badge>
            <Progress value={progress} className="w-16" />
          </div>
        )
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READY":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "UPLOADING":
        return <Upload className="h-4 w-4 text-yellow-500" />
      case "FAILED":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Datasets</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your training datasets for fine-tuning AI models
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Upload Dataset
        </Button>
      </div>

      {/* Upload Modal/Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Dataset</CardTitle>
          <CardDescription>
            Upload your training data to get started with fine-tuning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Datasets</p>
                <p className="text-2xl font-bold">{datasets.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-2xl font-bold">{datasets.filter(d => d.status === "READY").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold">{datasets.filter(d => d.status === "PROCESSING").length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{datasets.reduce((sum, d) => sum + d.recordCount, 0).toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                {statuses.filter(s => s !== "all").map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select 
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Formats</option>
                {formats.filter(f => f !== "all").map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dataset List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading datasets...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDatasets.map((dataset) => (
          <Card key={dataset.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(dataset.status)}
                    <h3 className="text-lg font-semibold">{dataset.name}</h3>
                    {getStatusBadge(dataset.status, dataset.progress)}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {dataset.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    <span>📄 {dataset.fileName}</span>
                    <span>📦 {dataset.fileSize} MB</span>
                    <span>📊 {dataset.recordCount.toLocaleString()} records</span>
                    <span>🏷️ {dataset.format}</span>
                    <span>📅 {dataset.createdAt}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {dataset.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {dataset.error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-red-600">
                        <AlertCircle className="inline h-4 w-4 mr-1" />
                        {dataset.error}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button onClick={() => handlePreviewDataset(dataset.id)} variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button onClick={() => handleEditDataset(dataset.id)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button onClick={() => handleDownloadDataset(dataset.id)} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button onClick={() => handleDeleteDataset(dataset.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              
              {dataset.preview.length > 0 && (
                <Tabs defaultValue="preview" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="mt-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(dataset.preview, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="stats" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dataset.recordCount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Total Records</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dataset.fileSize}</p>
                        <p className="text-sm text-gray-500">Size (MB)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dataset.format}</p>
                        <p className="text-sm text-gray-500">Format</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dataset.tags.length}</p>
                        <p className="text-sm text-gray-500">Tags</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="schema" className="mt-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                      <p className="text-sm text-gray-500">
                        Schema information will be displayed here based on the dataset format.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {filteredDatasets.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Dataset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}