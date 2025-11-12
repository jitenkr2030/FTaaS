"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  GitCompare, 
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ModelVersion {
  id: string
  version: string
  name: string
  description?: string
  status: string
  checkpoint?: string
  parameters: any
  metrics?: any
  isActive: boolean
  isProduction: boolean
  createdAt: string
  releasedAt?: string
  benchmarks: any[]
}

interface VersionComparison {
  version1: ModelVersion
  version2: ModelVersion
  differences: any
}

interface VersionManagerProps {
  fineTunedModelId: string
  modelName: string
}

export function VersionManager({ fineTunedModelId, modelName }: VersionManagerProps) {
  const [versions, setVersions] = useState<ModelVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [nextVersion, setNextVersion] = useState("")

  useEffect(() => {
    fetchVersions()
  }, [fineTunedModelId])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/versions?fineTunedModelId=${fineTunedModelId}`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      }
    } catch (error) {
      console.error("Error fetching versions:", error)
    } finally {
      setLoading(false)
    }
  }

  const createVersion = async (formData: FormData) => {
    try {
      const response = await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fineTunedModelId,
          version: formData.get("version"),
          name: formData.get("name"),
          description: formData.get("description"),
          parameters: JSON.parse(formData.get("parameters") as string || "{}"),
        })
      })

      if (response.ok) {
        setShowCreateDialog(false)
        await fetchVersions()
      }
    } catch (error) {
      console.error("Error creating version:", error)
    }
  }

  const updateVersion = async (versionId: string, action: string) => {
    try {
      const response = await fetch(`/api/versions/${versionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchVersions()
      }
    } catch (error) {
      console.error("Error updating version:", error)
    }
  }

  const deleteVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/versions/${versionId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchVersions()
      }
    } catch (error) {
      console.error("Error deleting version:", error)
    }
  }

  const compareVersions = async () => {
    if (selectedVersions.length !== 2) return

    try {
      setComparisonLoading(true)
      const response = await fetch(`/api/versions/compare?versionId1=${selectedVersions[0]}&versionId2=${selectedVersions[1]}`)
      if (response.ok) {
        const data = await response.json()
        setComparison(data)
      }
    } catch (error) {
      console.error("Error comparing versions:", error)
    } finally {
      setComparisonLoading(false)
    }
  }

  const fetchNextVersion = async () => {
    try {
      const response = await fetch(`/api/versions/next?fineTunedModelId=${fineTunedModelId}`)
      if (response.ok) {
        const data = await response.json()
        setNextVersion(data.nextVersion)
      }
    } catch (error) {
      console.error("Error fetching next version:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>
      case "TESTING":
        return <Badge className="bg-yellow-500">Testing</Badge>
      case "STAGING":
        return <Badge className="bg-blue-500">Staging</Badge>
      case "PRODUCTION":
        return <Badge className="bg-green-500">Production</Badge>
      case "DEPRECATED":
        return <Badge variant="outline">Deprecated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    if (showCreateDialog) {
      fetchNextVersion()
    }
  }, [showCreateDialog])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Model Versions</h3>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Model Versions</h3>
          <p className="text-sm text-muted-foreground">
            {modelName} • {versions.length} versions
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
              <DialogDescription>
                Create a new version of {modelName}
              </DialogDescription>
            </DialogHeader>
            <form action={createVersion} className="space-y-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  defaultValue={nextVersion}
                  placeholder="1.0.0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Version name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Version description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="parameters">Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  name="parameters"
                  placeholder='{"learning_rate": 0.001, "batch_size": 32}'
                  rows={4}
                  defaultValue="{}"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Create Version</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Versions</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first version to start tracking model iterations
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Version
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="versions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="space-y-4">
              <div className="space-y-4">
                {versions.map((version) => (
                  <Card key={version.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <GitCommit className="w-5 h-5" />
                            {version.name}
                            {version.isProduction && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </CardTitle>
                          <CardDescription>
                            Version {version.version} • {formatDate(version.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(version.status)}
                          {version.isActive && (
                            <Badge variant="outline" className="text-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {version.description && (
                          <p className="text-sm text-muted-foreground">{version.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Created: {formatDate(version.createdAt)}</span>
                          </div>
                          {version.releasedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Released: {formatDate(version.releasedAt)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          {version.status === "DRAFT" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateVersion(version.id, "promote-to-staging")}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Promote to Staging
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateVersion(version.id, "promote-to-production")}
                              >
                                <GitMerge className="w-4 h-4 mr-2" />
                                Promote to Production
                              </Button>
                            </>
                          )}
                          
                          {version.status === "STAGING" && (
                            <Button 
                              size="sm"
                              onClick={() => updateVersion(version.id, "promote-to-production")}
                            >
                              <GitMerge className="w-4 h-4 mr-2" />
                              Promote to Production
                            </Button>
                          )}
                          
                          {version.status === "PRODUCTION" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateVersion(version.id, "demote")}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Demote
                            </Button>
                          )}
                          
                          {!version.isProduction && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteVersion(version.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compare Versions</CardTitle>
                  <CardDescription>
                    Select two versions to compare their differences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Version 1</Label>
                        <Select onValueChange={(value) => {
                          const newSelected = [...selectedVersions]
                          newSelected[0] = value
                          setSelectedVersions(newSelected)
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select first version" />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.map((version) => (
                              <SelectItem key={version.id} value={version.id}>
                                {version.version} - {version.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Version 2</Label>
                        <Select onValueChange={(value) => {
                          const newSelected = [...selectedVersions]
                          newSelected[1] = value
                          setSelectedVersions(newSelected)
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select second version" />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.map((version) => (
                              <SelectItem key={version.id} value={version.id}>
                                {version.version} - {version.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={compareVersions}
                      disabled={selectedVersions.length !== 2 || comparisonLoading}
                    >
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare Versions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {comparisonLoading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </CardContent>
                </Card>
              )}

              {comparison && (
                <Card>
                  <CardHeader>
                    <CardTitle>Version Comparison</CardTitle>
                    <CardDescription>
                      Comparing {comparison.version1.version} with {comparison.version2.version}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Parameters Comparison */}
                      {comparison.differences.parameters && (
                        <div>
                          <h4 className="font-medium mb-2">Parameters</h4>
                          <div className="space-y-2">
                            {Object.entries(comparison.differences.parameters).map(([key, diff]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="font-medium">{key}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-red-600">
                                    {JSON.stringify(diff.from)}
                                  </span>
                                  <span>→</span>
                                  <span className="text-sm text-green-600">
                                    {JSON.stringify(diff.to)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metrics Comparison */}
                      {comparison.differences.metrics && (
                        <div>
                          <h4 className="font-medium mb-2">Metrics</h4>
                          <div className="space-y-2">
                            {Object.entries(comparison.differences.metrics).map(([key, diff]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="font-medium">{key}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-red-600">
                                    {JSON.stringify(diff.from)}
                                  </span>
                                  <span>→</span>
                                  <span className="text-sm text-green-600">
                                    {JSON.stringify(diff.to)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Benchmarks Comparison */}
                      {comparison.differences.benchmarks && (
                        <div>
                          <h4 className="font-medium mb-2">Benchmarks</h4>
                          <div className="space-y-2">
                            {Object.entries(comparison.differences.benchmarks).map(([key, diff]: [string, any]) => (
                              <div key={key} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium mb-1">{key}</div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-red-600">
                                    {JSON.stringify(diff.from)}
                                  </span>
                                  <span>→</span>
                                  <span className="text-green-600">
                                    {JSON.stringify(diff.to)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!Object.keys(comparison.differences).length && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            No differences found between these versions.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}