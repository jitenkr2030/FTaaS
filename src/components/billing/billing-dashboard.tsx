"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Rocket
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
    invoice: "INV-2024-001"
  },
  {
    id: "2",
    date: "2024-01-10",
    description: "API Usage - Fine-tuning Job",
    amount: 45.50,
    status: "paid",
    invoice: "INV-2024-002"
  },
  {
    id: "3",
    date: "2024-01-05",
    description: "API Usage - Evaluation",
    amount: 12.30,
    status: "paid",
    invoice: "INV-2024-003"
  },
  {
    id: "4",
    date: "2023-12-15",
    description: "Free Plan Subscription",
    amount: 0.00,
    status: "paid",
    invoice: "INV-2023-012"
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

export function BillingDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

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
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Method
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
                    disabled={plan.current}
                  >
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
                        <span className="text-sm">Evaluation API</span>
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
                        <span className="text-sm">1.8 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Model Files</span>
                        <span className="text-sm">0.5 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Evaluation Results</span>
                        <span className="text-sm">0.2 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Compute Usage
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">GPU Hours (Training)</span>
                        <span className="text-sm">2.5 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">GPU Hours (Inference)</span>
                        <span className="text-sm">0.5 hours</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Model Usage
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Models</span>
                        <span className="text-sm">1/1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Requests</span>
                        <span className="text-sm">1,250</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your payment history and download invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.description}</h4>
                        <p className="text-sm text-gray-500">{item.date} • {item.invoice}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${item.amount.toFixed(2)}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
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
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                        </h4>
                        <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Update your billing address and tax information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <p className="text-sm text-gray-500">Not specified</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tax ID</label>
                    <p className="text-sm text-gray-500">Not specified</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Billing Email</label>
                    <p className="text-sm text-gray-500">john@example.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Billing Address</label>
                    <p className="text-sm text-gray-500">Not specified</p>
                  </div>
                </div>
                <Button variant="outline">
                  Edit Billing Information
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}