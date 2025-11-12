"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap,
  Database,
  Server,
  Users,
  DollarSign,
  RefreshCw,
  Download,
  Settings,
  Filter,
  Calendar,
  Target,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from "lucide-react"

const systemMetrics = {
  uptime: "99.9%",
  responseTime: 45,
  throughput: 1250,
  errorRate: 0.1,
  activeUsers: 1247,
  cpuUsage: 65,
  memoryUsage: 78,
  diskUsage: 45,
  networkIn: 125,
  networkOut: 89
}

const alerts = [
  {
    id: "1",
    type: "warning",
    title: "High CPU Usage",
    description: "Server CPU usage is above 80% threshold",
    timestamp: "2024-01-22T14:30:00Z",
    severity: "medium",
    resolved: false
  },
  {
    id: "2",
    type: "info",
    title: "Scheduled Maintenance",
    description: "System maintenance scheduled for tonight at 2:00 AM",
    timestamp: "2024-01-22T12:00:00Z",
    severity: "low",
    resolved: false
  },
  {
    id: "3",
    type: "error",
    title: "API Timeout",
    description: "Multiple API requests timing out in us-east-1 region",
    timestamp: "2024-01-22T10:15:00Z",
    severity: "high",
    resolved: true
  }
]

const performanceData = [
  { time: "00:00", requests: 450, latency: 52, errors: 2 },
  { time: "04:00", requests: 320, latency: 48, errors: 1 },
  { time: "08:00", requests: 890, latency: 65, errors: 3 },
  { time: "12:00", requests: 1250, latency: 45, errors: 1 },
  { time: "16:00", requests: 1100, latency: 58, errors: 2 },
  { time: "20:00", requests: 780, latency: 62, errors: 1 },
  { time: "24:00", requests: 520, latency: 55, errors: 0 }
]

const resourceUsage = [
  { name: "GPU Clusters", used: 8, total: 10, percentage: 80 },
  { name: "CPU Cores", used: 156, total: 200, percentage: 78 },
  { name: "Memory", used: 64, total: 80, percentage: 80 },
  { name: "Storage", used: 2.8, total: 5, percentage: 56 },
  { name: "Network", used: 125, total: 200, percentage: 62 }
]

const modelPerformance = [
  {
    id: "1",
    name: "GPT-4 Customer Support",
    requests: 15420,
    avgLatency: 1.2,
    successRate: 99.8,
    cost: 234.50,
    trend: "up"
  },
  {
    id: "2",
    name: "LLaMA-3 Code Review",
    requests: 8750,
    avgLatency: 2.1,
    successRate: 99.2,
    cost: 156.80,
    trend: "stable"
  },
  {
    id: "3",
    name: "Mistral Medical",
    requests: 3200,
    avgLatency: 0.8,
    successRate: 99.9,
    cost: 89.20,
    trend: "down"
  }
]

export function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("24h")

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600"
      case "medium": return "text-yellow-600"
      case "low": return "text-blue-600"
      default: return "text-gray-600"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return <Badge variant="destructive">High</Badge>
      case "medium": return <Badge variant="secondary">Medium</Badge>
      case "low": return <Badge variant="outline">Low</Badge>
      default: return <Badge variant="outline">Info</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down": return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monitoring & Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor system performance, resource usage, and model analytics
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-green-600">{systemMetrics.uptime}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{systemMetrics.responseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests/sec</p>
                <p className="text-2xl font-bold">{systemMetrics.throughput}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-yellow-600">{systemMetrics.errorRate}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="models">Model Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Real-time system metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <div className="text-2xl font-bold">{systemMetrics.cpuUsage}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${systemMetrics.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <div className="text-2xl font-bold">{systemMetrics.memoryUsage}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${systemMetrics.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm font-medium">Disk Usage</span>
                  </div>
                  <div className="text-2xl font-bold">{systemMetrics.diskUsage}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${systemMetrics.diskUsage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Network</span>
                  </div>
                  <div className="text-sm">
                    <div>In: {systemMetrics.networkIn} Mbps</div>
                    <div>Out: {systemMetrics.networkOut} Mbps</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users & Requests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Users currently using the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">{systemMetrics.activeUsers}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Online</span>
                    <span className="text-green-600">1,247</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Idle</span>
                    <span className="text-yellow-600">89</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Offline</span>
                    <span className="text-gray-600">234</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Distribution</CardTitle>
                <CardDescription>API requests by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Model Inference</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fine-tuning</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Evaluation</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dataset Management</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance analysis over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">99.9%</p>
                    <p className="text-sm text-gray-500">Success Rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">45ms</p>
                    <p className="text-sm text-gray-500">Avg Latency</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">1.2K</p>
                    <p className="text-sm text-gray-500">Requests/sec</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="font-medium mb-4">Performance Chart (Last 24 Hours)</h4>
                  <div className="space-y-4">
                    {performanceData.map((data, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="w-16">{data.time}</span>
                        <div className="flex-1 mx-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Requests: {data.requests}</div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(data.requests / 1250) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Latency: {data.latency}ms</div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${(data.latency / 100) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="w-12 text-right">{data.errors} errors</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>
                Monitor resource allocation and utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {resourceUsage.map((resource, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{resource.name}</span>
                      <span className="text-sm text-gray-500">
                        {resource.used}{typeof resource.used === 'number' && resource.used > 10 ? '' : 'GB'}/{resource.total}{typeof resource.total === 'number' && resource.total > 10 ? '' : 'GB'} ({resource.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          resource.percentage > 80 ? 'bg-red-600' : 
                          resource.percentage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${resource.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GPU Clusters</CardTitle>
                <CardDescription>GPU resource allocation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cluster A (us-east-1)</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cluster B (eu-west-1)</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cluster C (ap-southeast-1)</span>
                    <Badge variant="secondary">Maintenance</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Systems</CardTitle>
                <CardDescription>Storage infrastructure status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Primary Storage</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Backup Storage</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Archive Storage</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Analytics</CardTitle>
              <CardDescription>
                Track performance metrics for your deployed models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelPerformance.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{model.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-500">Requests:</span>
                          <span className="ml-1 font-medium">{model.requests.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Latency:</span>
                          <span className="ml-1 font-medium">{model.avgLatency}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Success:</span>
                          <span className="ml-1 font-medium">{model.successRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span className="ml-1 font-medium">${model.cost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Trend:</span>
                          {getTrendIcon(model.trend)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Monitor and manage system alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        alert.type === 'error' ? 'bg-red-100' :
                        alert.type === 'warning' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {alert.type === 'error' ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                         alert.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-600" /> :
                         <Shield className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {getSeverityBadge(alert.severity)}
                          {alert.resolved && <Badge variant="outline">Resolved</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.resolved && (
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
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