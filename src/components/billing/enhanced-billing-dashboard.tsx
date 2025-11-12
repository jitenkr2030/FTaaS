"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  Zap,
  Database,
  FileText,
  Crown,
  Star,
  Rocket,
  ExternalLink,
  Loader2
} from "lucide-react"

const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out the platform",
    features: [
      "1 fine-tuned model",
      "5 datasets",
      "1,000 API calls/month",
      "Community support",
      "Basic analytics"
    ],
    limitations: [
      "Shared GPU resources",
      "No priority queue",
      "Basic model access"
    ],
    popular: false,
    current: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    period: "month",
    description: "For developers and small teams",
    features: [
      "10 fine-tuned models",
      "50 datasets",
      "100,000 API calls/month",
      "Priority support",
      "Advanced analytics",
      "Dedicated GPU",
      "Priority queue",
      "Custom model access"
    ],
    limitations: [],
    popular: true,
    current: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "month",
    description: "For large organizations",
    features: [
      "Unlimited fine-tuned models",
      "Unlimited datasets",
      "Unlimited API calls",
      "24/7 dedicated support",
      "Custom analytics",
      "Private GPU cluster",
      "SLA guarantee",
      "Custom models",
      "On-premise deployment",
      "Advanced security",
      "Compliance support"
    ],
    limitations: [],
    popular: false,
    current: false
  }
]

const usageData = {
  apiCalls: {
    used: 750,
    limit: 1000,
    percentage: 75
  },
  models: {
    used: 1,
    limit: 1,
    percentage: 100
  },
  datasets: {
    used: 3,
    limit: 5,
    percentage: 60
  },
  storage: {
    used: 2.5,
    limit: 10,
    percentage: 25
  }
}

const billingHistory = [
  {
    id: "1",
    date: "2024-01-15",
    description: "Pro Plan Subscription",
    amount: 99.00,
    status: "paid",
    invoice: "INV-2024-001",
    invoiceUrl: "#"
  },
  {
    id: "2",
    date: "2024-01-10",
    description: "API Usage - Fine-tuning Job",
    amount: 45.50,
    status: "paid",
    invoice: "INV-2024-002",
    invoiceUrl: "#"
  },
  {
    id: "3",
    date: "2024-01-05",
    description: "API Usage - Evaluation",
    amount: 12.30,
    status: "paid",
    invoice: "INV-2024-003",
    invoiceUrl: "#"
  },
  {
    id: "4",
    date: "2023-12-15",
    description: "Free Plan Subscription",
    amount: 0.00,
    status: "paid",
    invoice: "INV-2023-012",
    invoiceUrl: "#"
  }
]

const paymentMethods = [
  {
    id: "1",
    type: "credit_card",
    last4: "4242",
    brand: "visa",
    expiry: "12/25",
    isDefault: true
  }
]

export function EnhancedBillingDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpgrade = async (planType: 'pro' | 'enterprise') => {
    setLoading(true)
    try {
      // First, check if user has an existing subscription
      const subscriptionResponse = await fetch('/api/subscription', {
        method: 'GET',
      })

      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json()
        
        if (subscription.plan !== 'FREE') {
          // User has existing subscription, show proration options
          const prorationResponse = await fetch('/api/subscription/prorate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              action: 'preview', 
              newPlanType: planType 
            }),
          })

          if (prorationResponse.ok) {
            const prorationData = await prorationResponse.json()
            
            // Show proration modal or confirmation
            toast({
              title: "Subscription Change",
              description: `You have an existing subscription. Proration will be applied.`,
            })
            
            // For now, proceed with immediate upgrade
            const upgradeResponse = await fetch('/api/subscription/prorate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                action: 'upgrade', 
                newPlanType: planType,
                prorationOption: 'immediate'
              }),
            })

            if (upgradeResponse.ok) {
              toast({
                title: "Success",
                description: `Your subscription has been upgraded to ${planType}.`,
              })
              // Refresh the page to show updated subscription
              window.location.reload()
            } else {
              throw new Error('Failed to upgrade subscription')
            }
            return
          }
        }
      }

      // No existing subscription or free plan, proceed with normal checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (data.contactSales) {
        toast({
          title: "Contact Sales",
          description: "Please contact our sales team for Enterprise pricing.",
        })
        return
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500">Paid</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your subscription, usage, and billing information
          </p>
        </div>
        <Button 
          onClick={handleManageBilling}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Manage Billing
        </Button>
      </div>

      {/* Current Plan Overview */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan: Free
              </CardTitle>
              <CardDescription>
                You're currently on the Free plan. Upgrade to unlock more features.
              </CardDescription>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">$0</p>
              <p className="text-sm text-gray-500">Current Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">Jan 15</p>
              <p className="text-sm text-gray-500">Next Billing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">1/1</p>
              <p className="text-sm text-gray-500">Models Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">750/1K</p>
              <p className="text-sm text-gray-500">API Calls</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Monitor your resource usage for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">API Calls</span>
                      <span className={`text-sm ${getUsageColor(usageData.apiCalls.percentage)}`}>
                        {usageData.apiCalls.used}/{usageData.apiCalls.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${usageData.apiCalls.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Fine-tuned Models</span>
                      <span className={`text-sm ${getUsageColor(usageData.models.percentage)}`}>
                        {usageData.models.used}/{usageData.models.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${usageData.models.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Datasets</span>
                      <span className={`text-sm ${getUsageColor(usageData.datasets.percentage)}`}>
                        {usageData.datasets.used}/{usageData.datasets.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${usageData.datasets.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Storage (GB)</span>
                      <span className={`text-sm ${getUsageColor(usageData.storage.percentage)}`}>
                        {usageData.storage.used}/{usageData.storage.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${usageData.storage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold">$0.00</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold">$57.80</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Next Invoice</p>
                    <p className="text-2xl font-bold">$0.00</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Method</p>
                    <p className="text-2xl font-bold">•••• 4242</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-2 border-primary' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                {plan.current && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Features:</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Limitations:</h4>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-500">
                            <AlertCircle className="h-4 w-4" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    variant={plan.current ? "outline" : "default"}
                    disabled={plan.current || loading}
                    onClick={() => {
                      if (plan.id === 'pro') handleUpgrade('pro')
                      else if (plan.id === 'enterprise') handleUpgrade('enterprise')
                    }}
                  >
                    {loading && plan.id !== 'free' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {plan.current ? "Current Plan" : plan.price === "Custom" ? "Contact Sales" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage</CardTitle>
              <CardDescription>
                Breakdown of your resource usage across different services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      API Usage
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Fine-tuning Jobs</span>
                        <span className="text-sm">250 calls</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Model Inference</span>
                        <span className="text-sm">450 calls</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Evaluation</span>
                        <span className="text-sm">50 calls</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Storage Usage
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Datasets</span>
                        <span className="text-sm">1.2 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Models</span>
                        <span className="text-sm">0.8 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Logs</span>
                        <span className="text-sm">0.5 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Usage by Project</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Customer Support Bot</p>
                        <p className="text-sm text-gray-500">GPT-4 fine-tuned model</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">450 calls</p>
                        <p className="text-xs text-gray-500">$23.40</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Code Review Assistant</p>
                        <p className="text-sm text-gray-500">LLaMA-3 fine-tuned model</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">180 calls</p>
                        <p className="text-xs text-gray-500">$8.20</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Medical Text Analysis</p>
                        <p className="text-sm text-gray-500">Mistral fine-tuned model</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">120 calls</p>
                        <p className="text-xs text-gray-500">$15.60</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View your payment history and download invoices
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{item.date}</span>
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-500">{item.invoice}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">${item.amount.toFixed(2)}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      {item.invoiceUrl && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-8 w-8 text-gray-500" />
                      <div>
                        <p className="font-medium">
                          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                        </p>
                        <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && <Badge variant="default">Default</Badge>}
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  </div>
                ))}
                
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}