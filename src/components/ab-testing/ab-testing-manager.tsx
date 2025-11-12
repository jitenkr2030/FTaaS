"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { TestStatus, TestType, TestGoal } from "@prisma/client"

interface ABTest {
  id: string
  name: string
  description?: string
  type: TestType
  goal: TestGoal
  status: TestStatus
  config: any
  metrics: any
  startDate?: string
  endDate?: string
  duration?: number
  trafficSplit: number
  sampleSize?: number
  significanceLevel: number
  createdAt: string
  variants: ABTestVariant[]
  _count: {
    results: number
  }
}

interface ABTestVariant {
  id: string
  name: string
  description?: string
  modelId?: string
  config: any
  isControl: boolean
  weight: number
  model?: {
    id: string
    name: string
    modelId: string
  }
  _count: {
    results: number
  }
}

interface ABTestStats {
  totalParticipants: number
  conversionRate: number
  averageRevenue: number
  statisticalSignificance: number
  confidence: number
  winner?: string
  variants: {
    id: string
    name: string
    participants: number
    conversions: number
    conversionRate: number
    averageRevenue: number
    isControl: boolean
  }[]
}

export function ABTestingManager() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [stats, setStats] = useState<ABTestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const { toast } = useToast()

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: TestType.MODEL,
    goal: TestGoal.ACCURACY,
    config: '{}',
    metrics: '{}',
    duration: '',
    trafficSplit: '0.5',
    sampleSize: '',
    significanceLevel: '0.05'
  })

  const [variantForm, setVariantForm] = useState({
    testId: '',
    name: '',
    description: '',
    modelId: '',
    config: '{}',
    isControl: false,
    weight: '0.5'
  })

  useEffect(() => {
    loadTests()
  }, [])

  useEffect(() => {
    if (selectedTest) {
      loadStats(selectedTest.id)
    }
  }, [selectedTest])

  const loadTests = async () => {
    try {
      const response = await fetch('/api/ab-testing/tests')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load A/B tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-testing/stats?testId=${testId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading test stats:', error)
    }
  }

  const createTest = async () => {
    try {
      const response = await fetch('/api/ab-testing/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          duration: createForm.duration ? parseInt(createForm.duration) : undefined,
          trafficSplit: parseFloat(createForm.trafficSplit),
          sampleSize: createForm.sampleSize ? parseInt(createForm.sampleSize) : undefined,
          significanceLevel: parseFloat(createForm.significanceLevel),
          config: JSON.parse(createForm.config),
          metrics: JSON.parse(createForm.metrics)
        })
      })

      if (response.ok) {
        await loadTests()
        setShowCreateDialog(false)
        setCreateForm({
          name: '',
          description: '',
          type: TestType.MODEL,
          goal: TestGoal.ACCURACY,
          config: '{}',
          metrics: '{}',
          duration: '',
          trafficSplit: '0.5',
          sampleSize: '',
          significanceLevel: '0.05'
        })
        toast({
          title: "Success",
          description: "A/B test created successfully"
        })
      } else {
        throw new Error('Failed to create test')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create A/B test",
        variant: "destructive"
      })
    }
  }

  const createVariant = async () => {
    try {
      const response = await fetch('/api/ab-testing/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...variantForm,
          weight: parseFloat(variantForm.weight),
          config: JSON.parse(variantForm.config)
        })
      })

      if (response.ok) {
        await loadTests()
        setShowVariantDialog(false)
        toast({
          title: "Success",
          description: "Variant created successfully"
        })
      } else {
        throw new Error('Failed to create variant')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create variant",
        variant: "destructive"
      })
    }
  }

  const updateTestStatus = async (testId: string, action: string) => {
    try {
      const response = await fetch(`/api/ab-testing/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await loadTests()
        toast({
          title: "Success",
          description: `Test ${action}ed successfully`
        })
      } else {
        throw new Error('Failed to update test')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} test`,
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: TestStatus) => {
    const variants: Record<TestStatus, "default" | "secondary" | "destructive" | "outline"> = {
      [TestStatus.DRAFT]: "secondary",
      [TestStatus.RUNNING]: "default",
      [TestStatus.PAUSED]: "outline",
      [TestStatus.COMPLETED]: "outline",
      [TestStatus.CANCELLED]: "destructive"
    }

    return (
      <Badge variant={variants[status]}>
        {status.toLowerCase()}
      </Badge>
    )
  }

  const getTypeBadge = (type: TestType) => {
    return (
      <Badge variant="outline">
        {type.toLowerCase()}
      </Badge>
    )
  }

  const getGoalBadge = (goal: TestGoal) => {
    return (
      <Badge variant="outline">
        {goal.toLowerCase().replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing</h1>
          <p className="text-muted-foreground">
            Create and manage A/B tests for your models and features
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Create Test</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new A/B test to compare different variants
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Test Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="My A/B Test"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Test Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value) => setCreateForm({ ...createForm, type: value as TestType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TestType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Goal</Label>
                  <Select
                    value={createForm.goal}
                    onValueChange={(value) => setCreateForm({ ...createForm, goal: value as TestGoal })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TestGoal).map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal.toLowerCase().replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trafficSplit">Traffic Split</Label>
                  <Input
                    id="trafficSplit"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={createForm.trafficSplit}
                    onChange={(e) => setCreateForm({ ...createForm, trafficSplit: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={createForm.duration}
                    onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Sample Size</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    value={createForm.sampleSize}
                    onChange={(e) => setCreateForm({ ...createForm, sampleSize: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Test description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="config">Configuration</Label>
                  <Textarea
                    id="config"
                    value={createForm.config}
                    onChange={(e) => setCreateForm({ ...createForm, config: e.target.value })}
                    placeholder="{}"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metrics">Metrics</Label>
                  <Textarea
                    id="metrics"
                    value={createForm.metrics}
                    onChange={(e) => setCreateForm({ ...createForm, metrics: e.target.value })}
                    placeholder="{}"
                  />
                </div>
              </div>

              <Button onClick={createTest} disabled={creating}>
                {creating ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Tests</CardTitle>
              <CardDescription>
                Manage your A/B tests and their variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.description && (
                            <div className="text-sm text-muted-foreground">{test.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(test.type)}</TableCell>
                      <TableCell>{getGoalBadge(test.goal)}</TableCell>
                      <TableCell>{getStatusBadge(test.status)}</TableCell>
                      <TableCell>{test.variants.length}</TableCell>
                      <TableCell>{test._count.results}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTest(test)}
                          >
                            View
                          </Button>
                          {test.status === TestStatus.DRAFT && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTestStatus(test.id, 'start')}
                            >
                              Start
                            </Button>
                          )}
                          {test.status === TestStatus.RUNNING && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTestStatus(test.id, 'pause')}
                              >
                                Pause
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTestStatus(test.id, 'complete')}
                              >
                                Complete
                              </Button>
                            </>
                          )}
                          {test.status === TestStatus.PAUSED && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTestStatus(test.id, 'start')}
                            >
                              Resume
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedTest && (
            <Card>
              <CardHeader>
                <CardTitle>Test Details: {selectedTest.name}</CardTitle>
                <CardDescription>
                  View and manage test variants and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div>{getStatusBadge(selectedTest.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Traffic Split</div>
                    <div className="font-medium">{(selectedTest.trafficSplit * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">{selectedTest.duration || 'Unlimited'} days</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Significance Level</div>
                    <div className="font-medium">{(selectedTest.significanceLevel * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Variants</h3>
                    <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setVariantForm({ ...variantForm, testId: selectedTest.id })}
                        >
                          Add Variant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Variant</DialogTitle>
                          <DialogDescription>
                            Create a new variant for this test
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="variantName">Variant Name</Label>
                              <Input
                                id="variantName"
                                value={variantForm.name}
                                onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                                placeholder="Control"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="variantWeight">Weight</Label>
                              <Input
                                id="variantWeight"
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                value={variantForm.weight}
                                onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="variantDescription">Description</Label>
                            <Input
                              id="variantDescription"
                              value={variantForm.description}
                              onChange={(e) => setVariantForm({ ...variantForm, description: e.target.value })}
                              placeholder="Variant description"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="variantConfig">Configuration</Label>
                            <Textarea
                              id="variantConfig"
                              value={variantForm.config}
                              onChange={(e) => setVariantForm({ ...variantForm, config: e.target.value })}
                              placeholder="{}"
                            />
                          </div>

                          <Button onClick={createVariant}>
                            Add Variant
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Control</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTest.variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{variant.name}</div>
                              {variant.description && (
                                <div className="text-sm text-muted-foreground">{variant.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant.isControl ? "default" : "outline"}>
                              {variant.isControl ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>{(variant.weight * 100).toFixed(0)}%</TableCell>
                          <TableCell>{variant.model?.name || 'N/A'}</TableCell>
                          <TableCell>{variant._count.results}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats && selectedTest && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats.conversionRate * 100).toFixed(2)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.averageRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Statistical Significance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats.statisticalSignificance * 100).toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Variant Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Conversions</TableHead>
                        <TableHead>Conversion Rate</TableHead>
                        <TableHead>Avg Revenue</TableHead>
                        <TableHead>Winner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{variant.name}</span>
                              {variant.isControl && (
                                <Badge variant="outline">Control</Badge>
                              )}
                              {stats.winner === variant.id && (
                                <Badge variant="default">Winner</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{variant.participants}</TableCell>
                          <TableCell>{variant.conversions}</TableCell>
                          <TableCell>{(variant.conversionRate * 100).toFixed(2)}%</TableCell>
                          <TableCell>${variant.averageRevenue.toFixed(2)}</TableCell>
                          <TableCell>
                            {stats.winner === variant.id ? "🏆" : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedTest && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Select a test to view statistics</p>
                  <Button onClick={() => setSelectedTest(tests[0])}>
                    Select First Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}