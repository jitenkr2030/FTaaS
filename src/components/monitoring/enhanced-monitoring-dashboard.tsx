"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Shield,
  Brain,
  Gauge,
  Bell,
  BarChart
} from "lucide-react"

interface ModelMetric {
  id: string
  fineTunedModelId: string
  deploymentId?: string
  metricType: string
  value: number
  unit?: string
  timestamp: string
  metadata?: any
}

interface SystemHealth {
  id: string
  component: string
  status: string
  message?: string
  metrics?: any
  checkedAt: string
}

interface Alert {
  id: string
  name: string
  description?: string
  type: string
  severity: string
  status: string
  condition: any
  triggeredAt?: string
  resolvedAt?: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface AggregatedMetrics {
  [key: string]: {
    count: number
    sum: number
    avg: number
    min: number
    max: number
    values: number[]
  }
}

export function EnhancedMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("24h")
  const [selectedModel, setSelectedModel] = useState("")
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<ModelMetric[]>([])
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedMetrics>({})
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [systemMetrics, setSystemMetrics] = useState({
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
  })

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "text-red-600"
      case "medium": return "text-yellow-600"
      case "low": return "text-blue-600"
      case "critical": return "text-red-800"
      default: return "text-gray-600"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": 
      case "critical": 
        return <Badge variant="destructive">{severity}</Badge>
      case "medium": 
        return <Badge variant="secondary">{severity}</Badge>
      case "low": 
        return <Badge variant="outline">{severity}</Badge>
      default: 
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy": return "text-green-600"
      case "warning": return "text-yellow-600"
      case "critical": return "text-red-600"
      case "unknown": return "text-gray-600"
      default: return "text-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy": 
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning": 
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "critical": 
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      default: 
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch system health
      const healthResponse = await fetch('/api/monitoring/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData.health || [])
      }

      // Fetch alerts
      const alertsResponse = await fetch('/api/monitoring/alerts')
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.alerts || [])
      }

      // Fetch aggregated metrics if model is selected
      if (selectedModel) {
        const aggResponse = await fetch(`/api/monitoring/aggregated?fineTunedModelId=${selectedModel}&timeRange=${timeRange}`)
        if (aggResponse.ok) {
          const aggData = await aggResponse.json()
          setAggregatedMetrics(aggData.aggregatedMetrics || {})
        }

        const metricsResponse = await fetch(`/api/monitoring/metrics?fineTunedModelId=${selectedModel}&timeRange=${timeRange}`)
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          setMetrics(metricsData.metrics || [])
        }
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange, selectedModel])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(2)}ms`
    } else if (unit === 'USD') {
      return `$${value.toFixed(2)}`
    } else if (unit === '%') {
      return `${value.toFixed(2)}%`
    } else if (unit === 'requests/sec') {
      return `${value.toFixed(0)}/sec`
    } else {
      return value.toFixed(2)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Production Monitoring</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-time monitoring of deployed models and system health
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
          <TabsTrigger value="models">Model Analytics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="api">API Monitoring</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Status
              </CardTitle>
              <CardDescription>
                Current health status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemHealth.map((health) => (
                  <div key={health.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{health.component}</span>
                      {getStatusBadge(health.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {health.message || 'No issues detected'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last checked: {formatTimestamp(health.checkedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                Currently active alerts that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.name}</span>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <Badge variant="outline">{alert.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {formatTimestamp(alert.createdAt)}</span>
                        {alert.triggeredAt && (
                          <span>Triggered: {formatTimestamp(alert.triggeredAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Analytics
              </CardTitle>
              <CardDescription>
                Select a model to view detailed performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="model-1">GPT-4 Customer Support</SelectItem>
                    <SelectItem value="model-2">LLaMA-3 Code Review</SelectItem>
                    <SelectItem value="model-3">Mistral Medical</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">
                  Time Range: {timeRange}
                </span>
              </div>
            </CardContent>
          </Card>

          {selectedModel && (
            <>
              {/* Aggregated Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Aggregated Metrics
                  </CardTitle>
                  <CardDescription>
                    Performance summary for the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(aggregatedMetrics).map(([type, data]) => (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                          <Badge variant="outline">{data.count} samples</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Average:</span>
                            <span className="font-medium">{formatValue(data.avg)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min:</span>
                            <span>{formatValue(data.min)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max:</span>
                            <span>{formatValue(data.max)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Metrics</CardTitle>
                  <CardDescription>
                    Latest metric readings for the selected model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {metrics.slice(0, 20).map((metric) => (
                      <div key={metric.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {metric.metricType.replace('_', ' ')}
                            </span>
                            <Badge variant="outline">{metric.unit || ''}</Badge>
                          </div>
                          <span className="font-mono text-sm">
                            {formatValue(metric.value, metric.unit)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(metric.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* ROI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Total ROI
                </CardTitle>
                <CardDescription>
                  Return on investment for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  +245%
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>12% increase from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost per Prediction
                </CardTitle>
                <CardDescription>
                  Average cost per model prediction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  $0.008
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>15% decrease from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Efficiency Score
                </CardTitle>
                <CardDescription>
                  Overall system efficiency rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  87%
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>5% improvement from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Cost Analysis
              </CardTitle>
              <CardDescription>
                Detailed breakdown of costs and budget utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Cost by Model</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GPT-4 Customer Support</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm font-medium">$2,340</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">LLaMA-3 Code Review</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                        <span className="text-sm font-medium">$1,568</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mistral Medical</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm font-medium">$892</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Budget Utilization</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly Budget</span>
                        <span>$10,000</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-green-600 h-3 rounded-full" style={{ width: '48%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>$4,800 used</span>
                        <span>$5,200 remaining</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Business Impact
              </CardTitle>
              <CardDescription>
                Measurable business outcomes and value generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">$12,450</div>
                  <div className="text-sm text-gray-500">Cost Savings</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">$8,230</div>
                  <div className="text-sm text-gray-500">Revenue Generated</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">342 hrs</div>
                  <div className="text-sm text-gray-500">Productivity Gain</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">96%</div>
                  <div className="text-sm text-gray-500">Customer Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Performance Benchmarks
              </CardTitle>
              <CardDescription>
                Current performance vs. target benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Latency</div>
                      <div className="text-sm text-gray-500">Target: 100ms</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">45ms</div>
                      <Badge variant="outline">Good</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Throughput</div>
                      <div className="text-sm text-gray-500">Target: 1000 req/s</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">1,250 req/s</div>
                      <Badge variant="outline">Good</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Error Rate</div>
                      <div className="text-sm text-gray-500">Target: 1%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">0.1%</div>
                      <Badge variant="outline">Good</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Cost per Prediction</div>
                      <div className="text-sm text-gray-500">Target: $0.01</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">$0.008</div>
                      <Badge variant="outline">Good</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          {/* Anomaly Detection Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Anomalies
                </CardTitle>
                <CardDescription>
                  Anomalies detected in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">3</div>
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>2 new since last check</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Detection Accuracy
                </CardTitle>
                <CardDescription>
                  Accuracy of anomaly detection system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">94%</div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>3% improvement this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  False Positives
                </CardTitle>
                <CardDescription>
                  False positive rate this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">2.1%</div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingDown className="h-4 w-4" />
                  <span>0.5% decrease from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Anomalies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Anomalies
              </CardTitle>
              <CardDescription>
                Latest detected anomalies and their severity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">High Latency Spike</span>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Latency increased to 8,450ms (expected: 1,200ms) - 604% above threshold
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Model: GPT-4 Customer Support</span>
                    <span>Confidence: 98%</span>
                    <span>Duration: 15 minutes</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Unusual Cost Pattern</span>
                      <Badge variant="secondary">High</Badge>
                    </div>
                    <span className="text-sm text-gray-500">5 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Cost per prediction spiked to $0.045 (expected: $0.008) - 462% above threshold
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Model: LLaMA-3 Code Review</span>
                    <span>Confidence: 87%</span>
                    <span>Duration: 30 minutes</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Memory Usage Anomaly</span>
                      <Badge variant="outline">Medium</Badge>
                    </div>
                    <span className="text-sm text-gray-500">1 day ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Memory usage reached 94% (expected: 78%) - 21% above threshold
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Model: Mistral Medical</span>
                    <span>Confidence: 72%</span>
                    <span>Duration: 45 minutes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detected Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Detected Patterns
              </CardTitle>
              <CardDescription>
                Recurring patterns and trends identified in your metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Daily Traffic Pattern</span>
                    <Badge variant="outline">Seasonal</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Consistent daily traffic pattern detected with peak usage at 2-4 PM
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Confidence: 92%</span>
                    <span>Period: 24 hours</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Cost Optimization Trend</span>
                    <Badge variant="outline">Trend</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Gradual decrease in cost per prediction over the past month
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Confidence: 85%</span>
                    <span>Trend: Decreasing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly Detection Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Detection Configuration
              </CardTitle>
              <CardDescription>
                Configure anomaly detection sensitivity and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Detection Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sensitivity</span>
                      <Badge variant="outline">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Window Size</span>
                      <span className="text-sm font-medium">60 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Threshold Multiplier</span>
                      <span className="text-sm font-medium">2.5x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-detection</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Monitored Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cost</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Throughput</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Detection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {/* API Monitoring Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Endpoints</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <Server className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Healthy</p>
                    <p className="text-2xl font-bold text-green-600">22</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Degraded</p>
                    <p className="text-2xl font-bold text-yellow-600">1</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Down</p>
                    <p className="text-2xl font-bold text-red-600">1</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Overall API performance for the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">45ms</p>
                  <p className="text-sm text-gray-500">Avg Response Time</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">99.8%</p>
                  <p className="text-sm text-gray-500">Availability</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">1.2K</p>
                  <p className="text-sm text-gray-500">Requests/sec</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">0.2%</p>
                  <p className="text-sm text-gray-500">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                API Endpoints Status
              </CardTitle>
              <CardDescription>
                Current status of all monitored API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">GET /api/models</span>
                    <Badge variant="outline">models</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">45ms</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">POST /api/models/inference</span>
                    <Badge variant="outline">models</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">120ms</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">GET /api/datasets</span>
                    <Badge variant="outline">datasets</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">2,450ms</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">POST /api/fine-tuning</span>
                    <Badge variant="outline">fine-tuning</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Timeout</span>
                    <Badge className="bg-red-100 text-red-800">Down</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">GET /api/analytics</span>
                    <Badge variant="outline">analytics</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">35ms</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                API performance trends over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="text-center">
                      <div className="text-sm font-medium">{day}</div>
                      <div className="text-xs text-gray-500">45ms</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, 45 + i * 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Average: 52ms</span>
                  <span>Best: 38ms</span>
                  <span>Worst: 78ms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Check Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Health Check Actions
              </CardTitle>
              <CardDescription>
                Manage API health checks and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Health Checks
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Endpoints
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export API Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Details
              </CardTitle>
              <CardDescription>
                Detailed health information for all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((health) => (
                  <div key={health.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium capitalize">{health.component}</h3>
                        {getStatusBadge(health.status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(health.checkedAt)}
                      </span>
                    </div>
                    {health.message && (
                      <p className="text-sm text-gray-600 mb-2">{health.message}</p>
                    )}
                    {health.metrics && Object.keys(health.metrics).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {Object.entries(health.metrics).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <div className="font-medium capitalize">{key.replace('_', ' ')}</div>
                            <div className="text-gray-600">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All Alerts
              </CardTitle>
              <CardDescription>
                View and manage all system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No alerts found</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.name}</span>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{alert.type}</Badge>
                          <Badge variant={alert.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {alert.status}
                          </Badge>
                        </div>
                      </div>
                      {alert.description && (
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {formatTimestamp(alert.createdAt)}</span>
                        {alert.triggeredAt && (
                          <span>Triggered: {formatTimestamp(alert.triggeredAt)}</span>
                        )}
                        {alert.resolvedAt && (
                          <span>Resolved: {formatTimestamp(alert.resolvedAt)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Monitoring Configuration
              </CardTitle>
              <CardDescription>
                Configure monitoring settings and alert thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Alert Thresholds</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Latency Warning</span>
                        <span className="font-mono text-sm">1000ms</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Latency Critical</span>
                        <span className="font-mono text-sm">5000ms</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Error Rate Warning</span>
                        <span className="font-mono text-sm">5%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Error Rate Critical</span>
                        <span className="font-mono text-sm">10%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Notification Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Email Notifications</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">In-App Notifications</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Webhook Notifications</span>
                        <Badge variant="secondary">Disabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Data Retention</span>
                        <span className="font-mono text-sm">30 days</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Export your monitoring data for analysis or backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Export Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Model Metrics</span>
                      <Button variant="outline" size="sm">Export</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System Health</span>
                      <Button variant="outline" size="sm">Export</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alerts</span>
                      <Button variant="outline" size="sm">Export</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Metrics</span>
                      <Button variant="outline" size="sm">Export</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Comprehensive Report</span>
                      <Button size="sm">Export</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Data Retention</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Records</span>
                      <span className="text-sm font-medium">124,567</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Size</span>
                      <span className="text-sm font-medium">124 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Retention Period</span>
                      <span className="text-sm font-medium">30 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Oldest Record</span>
                      <span className="text-sm font-medium">30 days ago</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Clean Up Old Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}