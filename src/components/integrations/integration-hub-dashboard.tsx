"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { 
  Plug, 
  Play, 
  Pause, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Database,
  MessageSquare,
  Code,
  FileText,
  Users,
  Calendar,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Filter,
  Search,
  Activity,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  Shield,
  Key,
  Webhook,
  Api,
  Cloud,
  GitBranch,
  Mail,
  Slack,
  Github,
  FileText as NotionIcon,
  Headphones as ZendeskIcon
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: string
  status: "connected" | "disconnected" | "error" | "connecting"
  config: any
  lastSync?: string
  dataCount?: number
  metrics?: {
    syncFrequency: string
    dataVolume: string
    errorRate: number
    latency: number
  }
  createdAt: string
  updatedAt: string
}

interface DataFlow {
  id: string
  sourceIntegration: string
  targetIntegration: string
  status: "active" | "paused" | "error"
  dataVolume: string
  lastTransfer: string
  transformation: string
  createdAt: string
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: "active" | "inactive" | "error"
  headers: any
  lastTriggered?: string
  triggerCount: number
  createdAt: string
}

const mockIntegrations: Integration[] = [
  {
    id: "1",
    name: "Notion",
    description: "Import and sync documents, databases, and pages from Notion",
    category: "Productivity",
    icon: "notion",
    status: "connected",
    config: {
      workspaceId: "notion-workspace-123",
      databaseIds: ["db-1", "db-2"],
      syncFrequency: "hourly"
    },
    lastSync: "2024-01-22T14:30:00Z",
    dataCount: 1247,
    metrics: {
      syncFrequency: "hourly",
      dataVolume: "2.3 GB",
      errorRate: 0.02,
      latency: 1.2
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-22T14:30:00Z"
  },
  {
    id: "2",
    name: "GitHub",
    description: "Connect to repositories for code analysis and issue tracking",
    category: "Development",
    icon: "github",
    status: "connected",
    config: {
      repositories: ["owner/repo1", "owner/repo2"],
      syncTypes: ["issues", "pull-requests", "code"],
      webhookSecret: "****"
    },
    lastSync: "2024-01-22T14:25:00Z",
    dataCount: 892,
    metrics: {
      syncFrequency: "real-time",
      dataVolume: "1.8 GB",
      errorRate: 0.01,
      latency: 0.5
    },
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-22T14:25:00Z"
  },
  {
    id: "3",
    name: "Slack",
    description: "Import conversations and messages for training data",
    category: "Communication",
    icon: "slack",
    status: "disconnected",
    config: {
      workspace: "company-workspace",
      channels: ["#general", "#support"],
      botToken: "****"
    },
    metrics: {
      syncFrequency: "daily",
      dataVolume: "0 GB",
      errorRate: 0,
      latency: 0
    },
    createdAt: "2024-01-17T13:45:00Z",
    updatedAt: "2024-01-17T13:45:00Z"
  },
  {
    id: "4",
    name: "Zendesk",
    description: "Import support tickets and customer interactions",
    category: "Customer Support",
    icon: "zendesk",
    status: "error",
    config: {
      subdomain: "company",
      syncTypes: ["tickets", "users", "organizations"]
    },
    lastSync: "2024-01-21T16:20:00Z",
    dataCount: 534,
    metrics: {
      syncFrequency: "hourly",
      dataVolume: "856 MB",
      errorRate: 0.15,
      latency: 3.2
    },
    createdAt: "2024-01-18T11:15:00Z",
    updatedAt: "2024-01-21T16:20:00Z"
  }
]

const mockDataFlows: DataFlow[] = [
  {
    id: "1",
    sourceIntegration: "Notion",
    targetIntegration: "Dataset Processor",
    status: "active",
    dataVolume: "2.3 GB",
    lastTransfer: "2024-01-22T14:30:00Z",
    transformation: "Document to JSONL",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    sourceIntegration: "GitHub",
    targetIntegration: "Code Analysis",
    status: "active",
    dataVolume: "1.8 GB",
    lastTransfer: "2024-01-22T14:25:00Z",
    transformation: "Code to structured format",
    createdAt: "2024-01-16T09:30:00Z"
  }
]

const mockWebhooks: Webhook[] = [
  {
    id: "1",
    name: "Dataset Update Webhook",
    url: "https://api.example.com/webhooks/dataset-updated",
    events: ["dataset.created", "dataset.updated"],
    status: "active",
    headers: {
      "Authorization": "Bearer ****",
      "Content-Type": "application/json"
    },
    lastTriggered: "2024-01-22T14:30:00Z",
    triggerCount: 45,
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Training Completion Webhook",
    url: "https://api.example.com/webhooks/training-completed",
    events: ["training.completed", "training.failed"],
    status: "active",
    headers: {
      "Authorization": "Bearer ****",
      "Content-Type": "application/json"
    },
    lastTriggered: "2024-01-21T16:20:00Z",
    triggerCount: 12,
    createdAt: "2024-01-16T09:30:00Z"
  }
]

const availableIntegrations = [
  {
    name: "Notion",
    description: "Import documents, databases, and pages",
    category: "Productivity",
    icon: NotionIcon,
    authType: "OAuth2",
    requiredScopes: ["read:content", "read:database"]
  },
  {
    name: "GitHub",
    description: "Connect to repositories and organizations",
    category: "Development",
    icon: Github,
    authType: "OAuth2",
    requiredScopes: ["repo", "read:user"]
  },
  {
    name: "Slack",
    description: "Import conversations and messages",
    category: "Communication",
    icon: Slack,
    authType: "OAuth2",
    requiredScopes: ["channels:history", "users:read"]
  },
  {
    name: "Zendesk",
    description: "Import support tickets and customer data",
    category: "Customer Support",
    icon: ZendeskIcon,
    authType: "API Key",
    requiredScopes: ["tickets:read", "users:read"]
  },
  {
    name: "Google Drive",
    description: "Import documents and files",
    category: "Storage",
    icon: Cloud,
    authType: "OAuth2",
    requiredScopes: ["drive.readonly"]
  },
  {
    name: "Jira",
    description: "Import issues and project data",
    category: "Project Management",
    icon: Target,
    authType: "OAuth2",
    requiredScopes: ["read:issue", "read:project"]
  }
]

export function IntegrationHubDashboard() {
  const [activeTab, setActiveTab] = useState("integrations")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations)
  const [dataFlows, setDataFlows] = useState<DataFlow[]>(mockDataFlows)
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...new Set(integrations.map(i => i.category))]

  const handleConnectIntegration = async (integrationName: string) => {
    setLoading(true)
    try {
      // Simulate OAuth flow or API key setup
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newIntegration: Integration = {
        id: Date.now().toString(),
        name: integrationName,
        description: `Connected ${integrationName} integration`,
        category: "General",
        icon: integrationName.toLowerCase(),
        status: "connecting",
        config: {},
        metrics: {
          syncFrequency: "manual",
          dataVolume: "0 GB",
          errorRate: 0,
          latency: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setIntegrations([newIntegration, ...integrations])
      
      // Simulate connection completion
      setTimeout(() => {
        setIntegrations(prev => prev.map(i => 
          i.id === newIntegration.id 
            ? { ...i, status: "connected" as const, updatedAt: new Date().toISOString() }
            : i
        ))
        
        toast({
          title: "Integration Connected",
          description: `${integrationName} has been connected successfully.`,
        })
      }, 1000)
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${integrationName}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: "disconnected" as const, updatedAt: new Date().toISOString() }
          : i
      ))
      
      toast({
        title: "Integration Disconnected",
        description: "Integration has been disconnected successfully.",
      })
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncIntegration = async (integrationId: string) => {
    setLoading(true)
    try {
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: "connecting" as const }
          : i
      ))
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { 
              ...i, 
              status: "connected" as const, 
              lastSync: new Date().toISOString(),
              dataCount: (i.dataCount || 0) + Math.floor(Math.random() * 100),
              updatedAt: new Date().toISOString()
            }
          : i
      ))
      
      toast({
        title: "Sync Completed",
        description: "Integration has been synchronized successfully.",
      })
    } catch (error) {
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: "error" as const }
          : i
      ))
      
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize integration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <Badge variant="default" className="bg-green-500">Connected</Badge>
      case "disconnected":
      case "inactive":
        return <Badge variant="outline">Disconnected</Badge>
      case "connecting":
        return <Badge variant="secondary">Connecting</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getIntegrationIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      notion: NotionIcon,
      github: Github,
      slack: Slack,
      zendesk: ZendeskIcon,
      "google-drive": Cloud,
      jira: Target
    }
    const Icon = iconMap[iconName] || Plug
    return <Icon className="h-6 w-6" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Hub</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect external services and automate data import for your AI models
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold">{integrations.filter(i => i.status === "connected").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Flows</p>
                <p className="text-2xl font-bold">{dataFlows.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.filter(w => w.status === "active").length}</p>
              </div>
              <Webhook className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Data</p>
                <p className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + (i.dataCount || 0), 0).toLocaleString()}
                </p>
              </div>
              <Database className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data-flows">Data Flows</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search integrations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(c => c !== "all").map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Integration List */}
          <div className="grid gap-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getIntegrationIcon(integration.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{integration.name}</h3>
                          {getStatusBadge(integration.status)}
                          <Badge variant="outline">{integration.category}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {integration.description}
                        </p>
                        
                        {integration.lastSync && (
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last sync: {new Date(integration.lastSync).toLocaleString()}
                            </span>
                            {integration.dataCount && (
                              <span className="flex items-center gap-1">
                                <Database className="h-4 w-4" />
                                {integration.dataCount.toLocaleString()} items
                              </span>
                            )}
                          </div>
                        )}
                        
                        {integration.metrics && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Sync Frequency</p>
                              <p className="font-medium">{integration.metrics.syncFrequency}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Data Volume</p>
                              <p className="font-medium">{integration.metrics.dataVolume}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Error Rate</p>
                              <p className={`font-medium ${integration.metrics.errorRate > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                                {(integration.metrics.errorRate * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Latency</p>
                              <p className="font-medium">{integration.metrics.latency}s</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {integration.status === "connected" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSyncIntegration(integration.id)}
                            disabled={loading}
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Config
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{integration.name} Configuration</DialogTitle>
                                <DialogDescription>
                                  Manage integration settings and synchronization options
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Sync Frequency</label>
                                  <Select defaultValue={integration.config.syncFrequency || "hourly"}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="real-time">Real-time</SelectItem>
                                      <SelectItem value="hourly">Hourly</SelectItem>
                                      <SelectItem value="daily">Daily</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                      <SelectItem value="manual">Manual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Data Types</label>
                                  <div className="space-y-2">
                                    {integration.config.syncTypes?.map((type: string) => (
                                      <div key={type} className="flex items-center gap-2">
                                        <Switch id={type} defaultChecked />
                                        <label htmlFor={type} className="text-sm">{type}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      
                      {integration.status === "disconnected" && (
                        <Button 
                          onClick={() => handleConnectIntegration(integration.name)}
                          disabled={loading}
                        >
                          <Plug className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                      )}
                      
                      {integration.status === "connected" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisconnectIntegration(integration.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data-flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Data Flows</CardTitle>
              <CardDescription>
                Monitor data transfers between integrations and your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataFlows.map((flow) => (
                  <div key={flow.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(flow.status)}
                        <span className="text-lg font-semibold">
                          {flow.sourceIntegration} → {flow.targetIntegration}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{flow.dataVolume}</span>
                        <span>Last transfer: {new Date(flow.lastTransfer).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{flow.transformation}</Badge>
                      <span className="text-sm text-gray-500">
                        Created: {new Date(flow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Manage webhook endpoints for real-time notifications
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{webhook.name}</h3>
                          {getStatusBadge(webhook.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{webhook.url}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Triggered: {webhook.triggerCount} times</span>
                          {webhook.lastTriggered && (
                            <span>Last: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map((event, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Marketplace</CardTitle>
              <CardDescription>
                Browse and connect to available integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableIntegrations.map((integration, index) => {
                  const isConnected = integrations.some(i => i.name === integration.name)
                  const Icon = integration.icon
                  
                  return (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Icon className="h-8 w-8" />
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <Badge variant="outline">{integration.category}</Badge>
                          </div>
                        </div>
                        <CardDescription>{integration.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium">Authentication</p>
                            <p className="text-sm text-gray-600">{integration.authType}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Required Scopes</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {integration.requiredScopes.map((scope, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {scope}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => handleConnectIntegration(integration.name)}
                            disabled={isConnected || loading}
                          >
                            {isConnected ? "Connected" : "Connect"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}