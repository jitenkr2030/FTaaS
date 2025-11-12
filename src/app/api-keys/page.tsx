"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Shield, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react"

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: any
  expiresAt?: string
  createdAt: string
  isActive: boolean
  lastUsedAt?: string
}

export default function ApiKeysPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    permissions: "{}",
    expiresAt: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchApiKeys()
    }
  }, [status, router])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/api-keys")
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys)
      } else {
        setError("Failed to fetch API keys")
      }
    } catch (error) {
      setError("An error occurred while fetching API keys")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError("")

    try {
      let permissions = {}
      try {
        permissions = JSON.parse(formData.permissions)
      } catch {
        setError("Invalid JSON in permissions field")
        setCreateLoading(false)
        return
      }

      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          permissions,
          expiresAt: formData.expiresAt || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewKey(data.apiKey)
        setFormData({ name: "", permissions: "{}", expiresAt: "" })
        setShowCreateDialog(false)
        fetchApiKeys()
        setSuccess("API key created successfully!")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create API key")
      }
    } catch (error) {
      setError("An error occurred while creating the API key")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}/revoke`, {
        method: "POST",
      })

      if (response.ok) {
        setSuccess("API key revoked successfully")
        fetchApiKeys()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to revoke API key")
      }
    } catch (error) {
      setError("An error occurred while revoking the API key")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("API key copied to clipboard!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.isActive) {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Revoked</Badge>
    }
    if (isExpired(apiKey.expiresAt)) {
      return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>
    }
    return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-2">
            Manage your API keys for programmatic access to FTaaS
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for accessing FTaaS programmatically
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Production API Key"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions (JSON)</Label>
                <Textarea
                  id="permissions"
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  placeholder='{"models": ["read", "write"], "datasets": ["read"]}'
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Key
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* New Key Display */}
      {newKey && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              API Key Created Successfully
            </CardTitle>
            <CardDescription className="text-green-700">
              Please copy your API key now. You won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-800 break-all">
                    {newKey.key}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setNewKey(null)}
                className="w-full"
              >
                I've copied my key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="grid gap-6">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first API key to start using FTaaS programmatically
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                      <CardDescription>
                        Created on {formatDate(apiKey.createdAt)}
                        {apiKey.lastUsedAt && ` • Last used ${formatDate(apiKey.lastUsedAt)}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(apiKey)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeKey(apiKey.id)}
                      disabled={!apiKey.isActive}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">API Key</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {apiKey.key.slice(0, 20)}...
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {apiKey.expiresAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Expires At</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{formatDate(apiKey.expiresAt)}</span>
                        {isExpired(apiKey.expiresAt) && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {Object.keys(apiKey.permissions).length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700">Permissions</Label>
                    <div className="mt-1">
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(apiKey.permissions, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Security Notice */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Keep your API keys secret and never share them publicly</li>
            <li>• Use different keys for different environments (development, staging, production)</li>
            <li>• Set expiration dates for keys when possible</li>
            <li>• Regularly rotate your API keys</li>
            <li>• Revoke keys that are no longer in use</li>
            <li>• Monitor your API usage and set up alerts for unusual activity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}