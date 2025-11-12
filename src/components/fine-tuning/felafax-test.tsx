"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Activity,
  Cpu,
  DollarSign,
  Timer,
  BarChart3,
  Download
} from "lucide-react"
import { felafaxTester, TestResult } from "@/lib/felafax/tester"

export function FelafaxIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const { toast } = useToast()

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setCurrentTest(null)

    try {
      const results = await felafaxTester.runAllTests()
      setTestResults(results)
      
      const summary = felafaxTester.getSummary()
      
      toast({
        title: "Tests Completed",
        description: `${summary.passed}/${summary.total} tests passed (${summary.successRate.toFixed(1)}% success rate)`,
        variant: summary.successRate === 100 ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to run integration tests.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
      setCurrentTest(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500">Passed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'skipped':
        return <Badge variant="outline">Skipped</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const summary = felafaxTester.getSummary()

  const exportResults = () => {
    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        summary,
        results: testResults
      }
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `felafax-integration-test-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Success",
      description: "Test results exported successfully.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Felafax Integration Tests</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test the integration between FTaaS and Felafax framework with different hardware configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
          
          {testResults.length > 0 && (
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          )}
        </div>
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.skipped}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Running Tests</span>
                <span className="text-sm text-gray-600">{currentTest || 'Initializing...'}</span>
              </div>
              <Progress value={66} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="hardware">Hardware Tests</TabsTrigger>
          <TabsTrigger value="performance">Performance Tests</TabsTrigger>
          <TabsTrigger value="integration">Integration Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No test results yet. Click "Run Tests" to start testing.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(result.status)}
                          <h3 className="font-semibold">{result.testName}</h3>
                          {getStatusBadge(result.status)}
                          {result.duration && (
                            <Badge variant="outline" className="text-xs">
                              <Timer className="h-3 w-3 mr-1" />
                              {result.duration}ms
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{result.message}</p>
                        
                        {result.details && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'TPU Testing', icon: Cpu, color: 'purple', description: 'Test TPU configuration and performance' },
              { name: 'GPU Testing', icon: Cpu, color: 'green', description: 'Test GPU configuration and performance' },
              { name: 'AMD Testing', icon: Cpu, color: 'red', description: 'Test AMD GPU configuration and performance' },
              { name: 'Trainium Testing', icon: Cpu, color: 'blue', description: 'Test Trainium configuration and performance' },
              { name: 'Precision Testing', icon: BarChart3, color: 'orange', description: 'Test different precision modes' },
              { name: 'Memory Testing', icon: Timer, color: 'indigo', description: 'Test memory allocation and usage' }
            ].map((test, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <test.icon className={`h-5 w-5 text-${test.color}-500`} />
                    {test.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="outline">Not Run</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span>-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Estimation Performance</CardTitle>
                <CardDescription>Test accuracy and performance of cost estimation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estimation Accuracy</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span>-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hardware Variants</span>
                    <span>4 configurations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Performance</CardTitle>
                <CardDescription>Test training job performance and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Job Creation Time</span>
                    <span>-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status Updates</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancellation Time</span>
                    <span>-</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
                <CardDescription>Test API endpoints and data flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Health</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Authentication</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Data Validation</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Error Handling</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WebSocket Integration</CardTitle>
                <CardDescription>Test real-time communication and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Connection Test</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Message Delivery</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Real-time Updates</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Connection Stability</span>
                    <Badge variant="outline">Not Tested</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}