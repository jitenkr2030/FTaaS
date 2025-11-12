"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Cpu,
  Zap,
  HardDrive,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { felafaxService, TrainingJob } from "@/lib/felafax/service"
import { HardwareType } from "@/types/felafax"

interface CostBreakdown {
  hardware: HardwareType
  totalCost: number
  totalHours: number
  jobCount: number
  averageCostPerJob: number
}

interface CostSummary {
  totalCost: number
  totalHours: number
  totalJobs: number
  averageCostPerJob: number
  averageCostPerHour: number
  breakdown: CostBreakdown[]
  monthlyTrend: Array<{
    month: string
    cost: number
    jobs: number
  }>
}

export function FelafaxCostTracking() {
  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("all")
  const [selectedHardware, setSelectedHardware] = useState<HardwareType | "all">("all")
  const { toast } = useToast()

  const hardwareCosts = {
    [HardwareType.TPU]: 3.22,
    [HardwareType.TRAINIUM]: 4.03,
    [HardwareType.GPU]: 1.00,
    [HardwareType.AMD]: 0.80
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    if (jobs.length > 0) {
      calculateCostSummary()
    }
  }, [jobs, timeRange, selectedHardware])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const jobsData = await felafaxService.listJobs()
      setJobs(jobsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs for cost analysis.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateCostSummary = () => {
    const now = new Date()
    let filteredJobs = [...jobs]

    // Filter by time range
    if (timeRange !== "all") {
      const days = parseInt(timeRange)
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filteredJobs = filteredJobs.filter(job => new Date(job.created_at) >= cutoffDate)
    }

    // Filter by hardware
    if (selectedHardware !== "all") {
      filteredJobs = filteredJobs.filter(job => job.hardware === selectedHardware)
    }

    // Calculate total costs and hours
    let totalCost = 0
    let totalHours = 0
    const hardwareBreakdown: Record<HardwareType, CostBreakdown> = {
      [HardwareType.TPU]: {
        hardware: HardwareType.TPU,
        totalCost: 0,
        totalHours: 0,
        jobCount: 0,
        averageCostPerJob: 0
      },
      [HardwareType.TRAINIUM]: {
        hardware: HardwareType.TRAINIUM,
        totalCost: 0,
        totalHours: 0,
        jobCount: 0,
        averageCostPerJob: 0
      },
      [HardwareType.GPU]: {
        hardware: HardwareType.GPU,
        totalCost: 0,
        totalHours: 0,
        jobCount: 0,
        averageCostPerJob: 0
      },
      [HardwareType.AMD]: {
        hardware: HardwareType.AMD,
        totalCost: 0,
        totalHours: 0,
        jobCount: 0,
        averageCostPerJob: 0
      }
    }

    // Calculate monthly trend
    const monthlyData: Record<string, { cost: number; jobs: number }> = {}
    
    filteredJobs.forEach(job => {
      const costPerHour = hardwareCosts[job.hardware]
      const jobDuration = (new Date().getTime() - new Date(job.created_at).getTime()) / 1000 / 3600 // hours
      const estimatedCost = jobDuration * costPerHour
      
      totalCost += estimatedCost
      totalHours += jobDuration
      
      // Update hardware breakdown
      if (hardwareBreakdown[job.hardware]) {
        hardwareBreakdown[job.hardware].totalCost += estimatedCost
        hardwareBreakdown[job.hardware].totalHours += jobDuration
        hardwareBreakdown[job.hardware].jobCount += 1
      }
      
      // Update monthly trend
      const month = new Date(job.created_at).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { cost: 0, jobs: 0 }
      }
      monthlyData[month].cost += estimatedCost
      monthlyData[month].jobs += 1
    })

    // Calculate averages for hardware breakdown
    Object.values(hardwareBreakdown).forEach(breakdown => {
      breakdown.averageCostPerJob = breakdown.jobCount > 0 ? breakdown.totalCost / breakdown.jobCount : 0
    })

    // Convert monthly data to array and sort
    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))

    setCostSummary({
      totalCost,
      totalHours,
      totalJobs: filteredJobs.length,
      averageCostPerJob: filteredJobs.length > 0 ? totalCost / filteredJobs.length : 0,
      averageCostPerHour: totalHours > 0 ? totalCost / totalHours : 0,
      breakdown: Object.values(hardwareBreakdown).filter(b => b.jobCount > 0),
      monthlyTrend
    })
  }

  const exportCostReport = () => {
    if (!costSummary) return

    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      hardwareFilter: selectedHardware,
      summary: {
        totalCost: costSummary.totalCost,
        totalHours: costSummary.totalHours,
        totalJobs: costSummary.totalJobs,
        averageCostPerJob: costSummary.averageCostPerJob,
        averageCostPerHour: costSummary.averageCostPerHour
      },
      hardwareBreakdown: costSummary.breakdown,
      monthlyTrend: costSummary.monthlyTrend
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `felafax-cost-report-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Success",
      description: "Cost report exported successfully.",
    })
  }

  const getHardwareIcon = (hardware: HardwareType) => {
    switch (hardware) {
      case HardwareType.TPU:
        return <Cpu className="h-4 w-4 text-purple-500" />
      case HardwareType.TRAINIUM:
        return <Cpu className="h-4 w-4 text-blue-500" />
      case HardwareType.GPU:
        return <Cpu className="h-4 w-4 text-green-500" />
      case HardwareType.AMD:
        return <Cpu className="h-4 w-4 text-red-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (days > 0) {
      return `${days}d ${remainingHours.toFixed(1)}h`
    }
    return `${remainingHours.toFixed(1)}h`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Felafax Cost Tracking</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Analyze costs and optimize your Felafax training expenses
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading cost data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Felafax Cost Tracking</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Analyze costs and optimize your Felafax training expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedHardware} onValueChange={(value: HardwareType | "all") => setSelectedHardware(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hardware</SelectItem>
              <SelectItem value={HardwareType.TPU}>TPU</SelectItem>
              <SelectItem value={HardwareType.TRAINIUM}>Trainium</SelectItem>
              <SelectItem value={HardwareType.GPU}>GPU</SelectItem>
              <SelectItem value={HardwareType.AMD}>AMD</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportCostReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {costSummary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(costSummary.totalCost)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold">{formatHours(costSummary.totalHours)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold">{costSummary.totalJobs}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Cost/Job</p>
                    <p className="text-2xl font-bold">{formatCurrency(costSummary.averageCostPerJob)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hardware">Hardware Breakdown</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Distribution</CardTitle>
                    <CardDescription>Cost breakdown by hardware type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {costSummary.breakdown.map((breakdown) => {
                        const percentage = costSummary.totalCost > 0 ? (breakdown.totalCost / costSummary.totalCost) * 100 : 0
                        return (
                          <div key={breakdown.hardware}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getHardwareIcon(breakdown.hardware)}
                                <span className="font-medium">{breakdown.hardware}</span>
                              </div>
                              <span className="text-sm text-gray-600">{formatCurrency(breakdown.totalCost)} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="w-full" />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{breakdown.jobCount} jobs</span>
                              <span>{formatHours(breakdown.totalHours)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Efficiency</CardTitle>
                    <CardDescription>Average cost per job by hardware type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {costSummary.breakdown
                        .sort((a, b) => a.averageCostPerJob - b.averageCostPerJob)
                        .map((breakdown) => (
                          <div key={breakdown.hardware} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getHardwareIcon(breakdown.hardware)}
                              <div>
                                <p className="font-medium">{breakdown.hardware}</p>
                                <p className="text-sm text-gray-600">{breakdown.jobCount} jobs</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(breakdown.averageCostPerJob)}</p>
                              <p className="text-sm text-gray-600">avg per job</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hardware" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {costSummary.breakdown.map((breakdown) => (
                  <Card key={breakdown.hardware}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getHardwareIcon(breakdown.hardware)}
                        {breakdown.hardware}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">Total Cost</Label>
                        <p className="text-xl font-bold">{formatCurrency(breakdown.totalCost)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Total Hours</Label>
                        <p className="text-lg font-medium">{formatHours(breakdown.totalHours)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Jobs</Label>
                        <p className="text-lg font-medium">{breakdown.jobCount}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Avg Cost/Job</Label>
                        <p className="text-lg font-medium">{formatCurrency(breakdown.averageCostPerJob)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Cost Trends</CardTitle>
                  <CardDescription>Cost and job count trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {costSummary.monthlyTrend.map((trend) => (
                      <div key={trend.month}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{new Date(trend.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{trend.jobs} jobs</span>
                            <span className="font-bold">{formatCurrency(trend.cost)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.max((trend.cost / Math.max(...costSummary.monthlyTrend.map(t => t.cost))) * 100, 5)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Cost Optimization Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">Use TPU for Large Models</p>
                          <p className="text-sm text-green-700">TPUs offer 30% cost savings for models larger than 8B parameters</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Optimize Batch Size</p>
                          <p className="text-sm text-blue-700">Larger batch sizes can reduce training time and costs</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Cpu className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-800">Consider AMD GPUs</p>
                          <p className="text-sm text-purple-700">AMD GPUs offer the lowest cost per hour for smaller models</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Cost Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {costSummary.averageCostPerJob > 100 && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>High Average Cost:</strong> Your average cost per job is {formatCurrency(costSummary.averageCostPerJob)}. 
                            Consider optimizing your training parameters.
                          </p>
                        </div>
                      )}
                      
                      {costSummary.totalHours > 100 && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>Long Training Times:</strong> Total training time exceeds 100 hours. 
                            Consider using more powerful hardware or optimizing your dataset.
                          </p>
                        </div>
                      )}
                      
                      {costSummary.breakdown.some(b => b.hardware === HardwareType.GPU && b.totalCost > costSummary.totalCost * 0.5) && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>GPU Heavy Usage:</strong> More than 50% of costs are from GPUs. 
                            Consider switching to TPUs for better cost efficiency.
                          </p>
                        </div>
                      )}
                      
                      {!costSummary.breakdown.some(b => b.hardware === HardwareType.TPU) && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>No TPU Usage:</strong> You haven't used TPUs yet. 
                            Consider trying TPUs for potential cost savings on large models.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}