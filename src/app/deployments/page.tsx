"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DeploymentManager } from "@/components/deployments/deployment-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Server, 
  Brain, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft
} from "lucide-react"

interface FineTunedModel {
  id: string
  name: string
  modelId: string
  status: string
  createdAt: string
  deployedAt?: string
  endpoint?: string
  baseModel: {
    name: string
    provider: string
  }
}

export default function DeploymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [models, setModels] = useState<FineTunedModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchModels()
    }
  }, [status, router])

  const fetchModels = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/fine-tuning/jobs")
      if (response.ok) {
        const data = await response.json()
        // Filter for completed jobs with associated models
        const completedJobs = data.filter((job: any) => 
          job.status === "COMPLETED" && job.fineTunedModel
        )
        
        const modelsData = completedJobs.map((job: any) => ({
          id: job.fineTunedModel.id,
          name: job.fineTunedModel.name,
          modelId: job.fineTunedModel.modelId,
          status: job.fineTunedModel.status,
          createdAt: job.fineTunedModel.createdAt,
          deployedAt: job.fineTunedModel.deployedAt,
          endpoint: job.fineTunedModel.endpoint,
          baseModel: {
            name: job.baseModel.name,
            provider: job.baseModel.provider
          }
        }))
        
        setModels(modelsData)
        
        // Auto-select the first model if none selected
        if (modelsData.length > 0 && !selectedModelId) {
          setSelectedModelId(modelsData[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching models:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Ready</Badge>
      case "DEPLOYED":
        return <Badge className="bg-blue-500"><Server className="w-3 h-3 mr-1" /> Deployed</Badge>
      case "TRAINING":
        return <Badge variant="secondary"><Brain className="w-3 h-3 mr-1" /> Training</Badge>
      case "FAILED":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Model Deployments</h1>
          <p className="text-muted-foreground">
            Deploy your fine-tuned models to production endpoints
          </p>
        </div>
      </div>

      <Tabs defaultValue="deploy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deploy">Deploy Models</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-6">
          {models.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Models Available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You need to complete a fine-tuning job first before you can deploy models.
                </p>
                <Button onClick={() => router.push("/fine-tuning")}>
                  Go to Fine-tuning
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Select Model to Deploy</CardTitle>
                  <CardDescription>
                    Choose a fine-tuned model to deploy to a production endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            {model.name} ({model.baseModel.name})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedModelId && (
                <DeploymentManager fineTunedModelId={selectedModelId} />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{models.length}</div>
                <p className="text-xs text-muted-foreground">
                  Fine-tuned models available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deployed Models</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.filter(m => m.status === "DEPLOYED").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently deployed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready Models</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.filter(m => m.status === "READY").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for deployment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.filter(m => m.endpoint).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Live API endpoints
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Models</CardTitle>
              <CardDescription>
                Overview of all your fine-tuned models and their deployment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{model.name}</h4>
                        {getStatusBadge(model.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.baseModel.name} • {model.baseModel.provider}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created: {formatDate(model.createdAt)}
                        </div>
                        {model.deployedAt && (
                          <div className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            Deployed: {formatDate(model.deployedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.endpoint && (
                        <Badge variant="outline" className="text-green-600">
                          Live
                        </Badge>
                      )}
                      {model.status === "READY" && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedModelId(model.id)
                            const deployTab = document.querySelector('[value="deploy"]') as HTMLElement
                            deployTab?.click()
                          }}
                        >
                          Deploy
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}