"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Server, 
  Globe, 
  Activity, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Square,
  RefreshCw
} from "lucide-react"

interface Deployment {
  id: string
  endpoint: string
  status: string
  url?: string
  provider: string
  region?: string
  configuration: any
  metrics?: any
  cost: number
  isActive: boolean
  createdAt: string
  deployedAt?: string
  terminatedAt?: string
  fineTunedModel: {
    id: string
    name: string
    modelId: string
    status: string
  }
}

interface DeploymentManagerProps {
  fineTunedModelId?: string
}

export function DeploymentManager({ fineTunedModelId }: DeploymentManagerProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

  useEffect(() => {
    fetchDeployments()
  }, [fineTunedModelId])

  const fetchDeployments = async () => {
    try {
      setLoading(true)
      const params = fineTunedModelId ? `?fineTunedModelId=${fineTunedModelId}` : ""
      const response = await fetch(`/api/deployments${params}`)
      if (response.ok) {
        const data = await response.json()
        setDeployments(data)
      }
    } catch (error) {
      console.error("Error fetching deployments:", error)
    } finally {
      setLoading(false)
    }
  }

  const createDeployment = async (provider: string) => {
    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fineTunedModelId,
          provider,
          configuration: {
            region: "us-east-1",
            scalingConfig: {
              minInstances: 1,
              maxInstances: 3,
              targetUtilization: 0.7
            },
            securityConfig: {
              enableAuth: true,
              allowedOrigins: ["*"],
              rateLimit: 100
            }
          }
        })
      })

      if (response.ok) {
        await fetchDeployments()
      }
    } catch (error) {
      console.error("Error creating deployment:", error)
    }
  }

  const terminateDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployments/${deploymentId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchDeployments()
      }
    } catch (error) {
      console.error("Error terminating deployment:", error)
    }
  }

  const fetchMetrics = async (deploymentId: string) => {
    try {
      setMetricsLoading(true)
      const response = await fetch(`/api/deployments/${deploymentId}/metrics`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setMetricsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case "DEPLOYING":
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Deploying</Badge>
      case "DEPLOYED":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Deployed</Badge>
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
      case "TERMINATED":
        return <Badge variant="outline"><Square className="w-3 h-3 mr-1" /> Terminated</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(3)}/hour`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
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
          <h2 className="text-2xl font-bold">Model Deployments</h2>
          <p className="text-muted-foreground">
            Deploy your fine-tuned models to production endpoints
          </p>
        </div>
        {fineTunedModelId && (
          <div className="flex gap-2">
            <Button 
              onClick={() => createDeployment("openai")}
              disabled={deployments.some(d => d.fineTunedModelId === fineTunedModelId && d.status === "DEPLOYING")}
            >
              <Server className="w-4 h-4 mr-2" />
              Deploy to OpenAI
            </Button>
            <Button 
              variant="outline"
              onClick={() => createDeployment("aws")}
              disabled={deployments.some(d => d.fineTunedModelId === fineTunedModelId && d.status === "DEPLOYING")}
            >
              <Server className="w-4 h-4 mr-2" />
              Deploy to AWS
            </Button>
          </div>
        )}
      </div>

      {deployments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Deployments</h3>
            <p className="text-muted-foreground text-center mb-4">
              Deploy your fine-tuned models to make them available via API endpoints
            </p>
            {fineTunedModelId && (
              <div className="flex gap-2">
                <Button onClick={() => createDeployment("openai")}>
                  Deploy to OpenAI
                </Button>
                <Button variant="outline" onClick={() => createDeployment("aws")}>
                  Deploy to AWS
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deployments.map((deployment) => (
            <Card key={deployment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      {deployment.fineTunedModel.name}
                    </CardTitle>
                    <CardDescription>
                      {deployment.provider} • {deployment.endpoint}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(deployment.status)}
                    {deployment.isActive && (
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <p className="text-sm text-muted-foreground">{deployment.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Cost</p>
                          <p className="text-sm text-muted-foreground">{formatCost(deployment.cost)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-muted-foreground">{formatDate(deployment.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {deployment.url && (
                      <Alert>
                        <Globe className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Endpoint URL:</strong> {deployment.url}
                        </AlertDescription>
                      </Alert>
                    )}

                    {deployment.status === "DEPLOYING" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Deployment in progress...</span>
                        </div>
                        <Progress value={65} className="w-full" />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      {deployment.status === "DEPLOYED" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedDeployment(deployment)
                              fetchMetrics(deployment.id)
                            }}
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            View Metrics
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => terminateDeployment(deployment.id)}
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Terminate
                          </Button>
                        </>
                      )}
                      {deployment.status === "FAILED" && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Deployment failed. Please check the configuration and try again.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="configuration" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Provider Settings</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Provider:</strong> {deployment.provider}</div>
                          <div><strong>Region:</strong> {deployment.configuration.region || "Default"}</div>
                          <div><strong>Endpoint:</strong> {deployment.endpoint}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Scaling Configuration</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Min Instances:</strong> {deployment.configuration.scalingConfig?.minInstances || 1}</div>
                          <div><strong>Max Instances:</strong> {deployment.configuration.scalingConfig?.maxInstances || 1}</div>
                          <div><strong>Target Utilization:</strong> {deployment.configuration.scalingConfig?.targetUtilization || 0.7}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-4">
                    {metricsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-20" />
                      </div>
                    ) : metrics ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Latency</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{metrics.latency?.toFixed(1) || 0}ms</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{metrics.throughput || 0} req/min</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Availability</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{((metrics.availability || 0) * 100).toFixed(2)}%</div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Alert>
                        <Activity className="h-4 w-4" />
                        <AlertDescription>
                          No metrics available. This deployment may not be active yet.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}