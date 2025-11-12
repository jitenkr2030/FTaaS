"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { DunningMethod, DunningStatus } from "@prisma/client"

interface DunningConfig {
  enabled: boolean
  maxAttempts: number
  retryIntervalDays: number
  methods: DunningMethod[]
  emailTemplate?: string
  smsTemplate?: string
  inAppTemplate?: string
  gracePeriodDays: number
  autoSuspend: boolean
  customRules?: any
}

interface DunningAttempt {
  id: string
  invoiceId: string
  attempt: number
  status: DunningStatus
  method: DunningMethod
  sentAt: string | null
  openedAt: string | null
  clickedAt: string | null
  paidAt: string | null
  nextAttempt: string | null
  message: string
  error: string | null
  createdAt: string
  invoice: {
    id: string
    invoiceNumber: string
    amount: number
    status: string
    dueDate: string
  }
}

interface DunningStats {
  totalAttempts: number
  successfulRecoveries: number
  pendingAttempts: number
  failedAttempts: number
  recoveryRate: number
  averageAttemptsPerRecovery: number
}

export function DunningManager() {
  const [config, setConfig] = useState<DunningConfig | null>(null)
  const [attempts, setAttempts] = useState<DunningAttempt[]>([])
  const [stats, setStats] = useState<DunningStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [configRes, attemptsRes, statsRes] = await Promise.all([
        fetch('/api/dunning/config'),
        fetch('/api/dunning/attempts'),
        fetch('/api/dunning/stats')
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData.config)
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json()
        setAttempts(attemptsData.attempts)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dunning data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/dunning/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Dunning configuration updated successfully"
        })
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dunning configuration",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: DunningStatus) => {
    const variants: Record<DunningStatus, "default" | "secondary" | "destructive" | "outline"> = {
      [DunningStatus.PENDING]: "secondary",
      [DunningStatus.SENT]: "default",
      [DunningStatus.OPENED]: "default",
      [DunningStatus.CLICKED]: "default",
      [DunningStatus.PAID]: "outline",
      [DunningStatus.FAILED]: "destructive",
      [DunningStatus.CANCELLED]: "secondary"
    }

    return (
      <Badge variant={variants[status]}>
        {status.replace('_', ' ').toLowerCase()}
      </Badge>
    )
  }

  const getMethodBadge = (method: DunningMethod) => {
    return (
      <Badge variant="outline">
        {method.replace('_', ' ').toLowerCase()}
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
      <div>
        <h1 className="text-3xl font-bold">Dunning Management</h1>
        <p className="text-muted-foreground">
          Manage failed payment recovery and automated dunning processes
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="attempts">Attempts</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dunning Configuration</CardTitle>
              <CardDescription>
                Configure automated payment recovery settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {config && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={config.enabled}
                      onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                    />
                    <Label htmlFor="enabled">Enable Dunning Management</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        value={config.maxAttempts}
                        onChange={(e) => setConfig({ ...config, maxAttempts: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryInterval">Retry Interval (Days)</Label>
                      <Input
                        id="retryInterval"
                        type="number"
                        value={config.retryIntervalDays}
                        onChange={(e) => setConfig({ ...config, retryIntervalDays: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                      <Input
                        id="gracePeriod"
                        type="number"
                        value={config.gracePeriodDays}
                        onChange={(e) => setConfig({ ...config, gracePeriodDays: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoSuspend"
                        checked={config.autoSuspend}
                        onCheckedChange={(checked) => setConfig({ ...config, autoSuspend: checked })}
                      />
                      <Label htmlFor="autoSuspend">Auto Suspend on Max Attempts</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Methods</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(DunningMethod).map((method) => (
                        <Badge
                          key={method}
                          variant={config.methods.includes(method) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const methods = config.methods.includes(method)
                              ? config.methods.filter(m => m !== method)
                              : [...config.methods, method]
                            setConfig({ ...config, methods })
                          }}
                        >
                          {method.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailTemplate">Email Template</Label>
                      <Textarea
                        id="emailTemplate"
                        value={config.emailTemplate || ''}
                        onChange={(e) => setConfig({ ...config, emailTemplate: e.target.value })}
                        placeholder="Use {{amount}}, {{dueDate}}, {{daysOverdue}}, {{attempt}}, {{maxAttempts}}, {{gracePeriod}} as placeholders"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smsTemplate">SMS Template</Label>
                      <Textarea
                        id="smsTemplate"
                        value={config.smsTemplate || ''}
                        onChange={(e) => setConfig({ ...config, smsTemplate: e.target.value })}
                        placeholder="Use {{amount}}, {{dueDate}}, {{daysOverdue}}, {{attempt}}, {{maxAttempts}}, {{gracePeriod}} as placeholders"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inAppTemplate">In-App Template</Label>
                      <Textarea
                        id="inAppTemplate"
                        value={config.inAppTemplate || ''}
                        onChange={(e) => setConfig({ ...config, inAppTemplate: e.target.value })}
                        placeholder="Use {{amount}}, {{dueDate}}, {{daysOverdue}}, {{attempt}}, {{maxAttempts}}, {{gracePeriod}} as placeholders"
                      />
                    </div>
                  </div>

                  <Button onClick={saveConfig} disabled={saving}>
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dunning Attempts</CardTitle>
              <CardDescription>
                View all dunning attempts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Next Attempt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{attempt.invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            ${attempt.invoice.amount.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>#{attempt.attempt}</TableCell>
                      <TableCell>{getMethodBadge(attempt.method)}</TableCell>
                      <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                      <TableCell>
                        {attempt.sentAt ? new Date(attempt.sentAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {attempt.nextAttempt ? new Date(attempt.nextAttempt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAttempts || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Successful Recoveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.successfulRecoveries || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recoveryRate.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pending Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pendingAttempts || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.failedAttempts || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg Attempts per Recovery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.averageAttemptsPerRecovery.toFixed(1) || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}