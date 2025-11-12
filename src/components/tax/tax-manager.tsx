"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { TaxType, ExemptionType, ExemptionStatus } from "@prisma/client"

interface TaxRegion {
  code: string
  name: string
  country: string
  type: TaxType
  rate: number
  enabled: boolean
}

interface TaxExemption {
  id: string
  type: ExemptionType
  certificate?: string
  regions: string[]
  validFrom: string
  validTo?: string
  status: ExemptionStatus
}

interface TaxCalculation {
  id: string
  taxAmount: number
  taxRate: number
  subtotal: number
  total: number
  regionCode: string
  createdAt: string
  region: {
    name: string
    country: string
    type: TaxType
  }
  invoice?: {
    invoiceNumber: string
    amount: number
    status: string
  }
}

interface TaxStats {
  totalTaxPaid: number
  totalTransactions: number
  averageTaxRate: number
  uniqueRegions: number
  taxByRegion: Record<string, number>
}

export function TaxManager() {
  const [regions, setRegions] = useState<TaxRegion[]>([])
  const [exemption, setExemption] = useState<TaxExemption | null>(null)
  const [calculations, setCalculations] = useState<TaxCalculation[]>([])
  const [stats, setStats] = useState<TaxStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [calculationResult, setCalculationResult] = useState<any>(null)
  const { toast } = useToast()

  const [calculationForm, setCalculationForm] = useState({
    amount: '',
    regionCode: '',
    country: ''
  })

  const [exemptionForm, setExemptionForm] = useState({
    type: ExemptionType.RESELLER,
    certificate: '',
    regions: [] as string[],
    validFrom: '',
    validTo: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [regionsRes, exemptionRes, calculationsRes, statsRes] = await Promise.all([
        fetch('/api/tax/regions'),
        fetch('/api/tax/exemption'),
        fetch('/api/tax/calculations'),
        fetch('/api/tax/stats')
      ])

      if (regionsRes.ok) {
        const regionsData = await regionsRes.json()
        setRegions(regionsData.regions)
      }

      if (exemptionRes.ok) {
        const exemptionData = await exemptionRes.json()
        setExemption(exemptionData.exemption)
      }

      if (calculationsRes.ok) {
        const calculationsData = await calculationsRes.json()
        setCalculations(calculationsData.calculations)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tax data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTax = async () => {
    if (!calculationForm.amount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive"
      })
      return
    }

    setCalculating(true)
    try {
      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(calculationForm.amount),
          regionCode: calculationForm.regionCode || undefined,
          country: calculationForm.country || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCalculationResult(data.result)
      } else {
        throw new Error('Failed to calculate tax')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate tax",
        variant: "destructive"
      })
    } finally {
      setCalculating(false)
    }
  }

  const createExemption = async () => {
    try {
      const response = await fetch('/api/tax/exemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exemptionForm)
      })

      if (response.ok) {
        const data = await response.json()
        setExemption(data.exemption)
        toast({
          title: "Success",
          description: "Tax exemption application submitted"
        })
      } else {
        throw new Error('Failed to create exemption')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tax exemption",
        variant: "destructive"
      })
    }
  }

  const getExemptionStatusBadge = (status: ExemptionStatus) => {
    const variants: Record<ExemptionStatus, "default" | "secondary" | "destructive" | "outline"> = {
      [ExemptionStatus.PENDING]: "secondary",
      [ExemptionStatus.APPROVED]: "default",
      [ExemptionStatus.REJECTED]: "destructive",
      [ExemptionStatus.EXPIRED]: "outline",
      [ExemptionStatus.REVOKED]: "destructive"
    }

    return (
      <Badge variant={variants[status]}>
        {status.toLowerCase()}
      </Badge>
    )
  }

  const getTaxTypeBadge = (type: TaxType) => {
    return (
      <Badge variant="outline">
        {type.toLowerCase()}
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
        <h1 className="text-3xl font-bold">Tax Management</h1>
        <p className="text-muted-foreground">
          Manage tax calculations, regions, and exemptions
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
          <TabsTrigger value="regions">Tax Regions</TabsTrigger>
          <TabsTrigger value="exemption">Tax Exemption</TabsTrigger>
          <TabsTrigger value="history">Calculation History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculator</CardTitle>
              <CardDescription>
                Calculate tax for a given amount and region
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={calculationForm.amount}
                    onChange={(e) => setCalculationForm({ ...calculationForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Tax Region (Optional)</Label>
                  <Select
                    value={calculationForm.regionCode}
                    onValueChange={(value) => setCalculationForm({ ...calculationForm, regionCode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name} ({region.country}) - {(region.rate * 100).toFixed(2)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country (Optional)</Label>
                  <Input
                    id="country"
                    value={calculationForm.country}
                    onChange={(e) => setCalculationForm({ ...calculationForm, country: e.target.value })}
                    placeholder="US"
                  />
                </div>
              </div>

              <Button onClick={calculateTax} disabled={calculating}>
                {calculating ? "Calculating..." : "Calculate Tax"}
              </Button>

              {calculationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Calculation Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Subtotal</div>
                        <div className="text-lg font-semibold">${calculationResult.subtotal.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tax Amount</div>
                        <div className="text-lg font-semibold">${calculationResult.taxAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tax Rate</div>
                        <div className="text-lg font-semibold">{(calculationResult.taxRate * 100).toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-lg font-semibold">${calculationResult.total.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground">Region</div>
                      <div className="font-medium">{calculationResult.regionName}</div>
                    </div>
                    {calculationResult.exempt && (
                      <Alert className="mt-4">
                        <AlertDescription>
                          {calculationResult.exemptionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Regions</CardTitle>
              <CardDescription>
                Available tax regions and their rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.code}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{region.name}</div>
                          <div className="text-sm text-muted-foreground">{region.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{region.country}</TableCell>
                      <TableCell>{getTaxTypeBadge(region.type)}</TableCell>
                      <TableCell>{(region.rate * 100).toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant={region.enabled ? "default" : "secondary"}>
                          {region.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exemption" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Exemption</CardTitle>
              <CardDescription>
                Manage your tax exemption status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {exemption ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div>{getExemptionStatusBadge(exemption.status)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div className="font-medium">{exemption.type.toLowerCase()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Certificate</div>
                      <div className="font-medium">{exemption.certificate || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Valid From</div>
                      <div className="font-medium">{new Date(exemption.validFrom).toLocaleDateString()}</div>
                    </div>
                    {exemption.validTo && (
                      <div>
                        <div className="text-sm text-muted-foreground">Valid To</div>
                        <div className="font-medium">{new Date(exemption.validTo).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Exempt Regions</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exemption.regions.map((region, index) => (
                        <Badge key={index} variant="outline">{region}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No tax exemption found. You can apply for tax exemption below.
                  </AlertDescription>
                </Alert>
              )}

              {!exemption && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exemptionType">Exemption Type</Label>
                      <Select
                        value={exemptionForm.type}
                        onValueChange={(value) => setExemptionForm({ ...exemptionForm, type: value as ExemptionType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ExemptionType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificate">Certificate Number</Label>
                      <Input
                        id="certificate"
                        value={exemptionForm.certificate}
                        onChange={(e) => setExemptionForm({ ...exemptionForm, certificate: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validFrom">Valid From</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={exemptionForm.validFrom}
                        onChange={(e) => setExemptionForm({ ...exemptionForm, validFrom: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validTo">Valid To (Optional)</Label>
                      <Input
                        id="validTo"
                        type="date"
                        value={exemptionForm.validTo}
                        onChange={(e) => setExemptionForm({ ...exemptionForm, validTo: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={createExemption}>
                    Apply for Tax Exemption
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calculation History</CardTitle>
              <CardDescription>
                View your tax calculation history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tax Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map((calc) => (
                    <TableRow key={calc.id}>
                      <TableCell>
                        {new Date(calc.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{calc.region.name}</div>
                          <div className="text-sm text-muted-foreground">{calc.region.country}</div>
                        </div>
                      </TableCell>
                      <TableCell>${calc.subtotal.toFixed(2)}</TableCell>
                      <TableCell>${calc.taxAmount.toFixed(2)}</TableCell>
                      <TableCell>${calc.total.toFixed(2)}</TableCell>
                      <TableCell>{(calc.taxRate * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Tax Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalTaxPaid.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Average Tax Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats.averageTaxRate * 100).toFixed(2)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Unique Regions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.uniqueRegions}</div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tax by Region</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.taxByRegion).map(([region, amount]) => (
                      <div key={region} className="flex justify-between">
                        <span className="font-medium">{region}</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}