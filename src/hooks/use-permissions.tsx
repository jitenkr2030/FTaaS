"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { hasPermission, getUserPermissions } from "@/lib/permissions"

interface WithPermissionProps {
  resource: string
  action: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function WithPermission({ resource, action, fallback, children }: WithPermissionProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermission = async () => {
      if (status === "unauthenticated") {
        router.push("/auth/signin")
        return
      }

      if (status === "authenticated" && session?.user?.id) {
        try {
          const access = await hasPermission({
            resource,
            action,
            userId: session.user.id
          })
          setHasAccess(access)
        } catch (error) {
          console.error("Error checking permission:", error)
          setHasAccess(false)
        } finally {
          setLoading(false)
        }
      }
    }

    checkPermission()
  }, [status, session, resource, action, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return fallback || (
      <div className="text-center p-4">
        <p className="text-gray-500">You don't have permission to access this resource.</p>
      </div>
    )
  }

  return <>{children}</>
}

interface UsePermissionsResult {
  hasPermission: (resource: string, action: string) => Promise<boolean>
  permissions: string[]
  loading: boolean
}

export function usePermissions(): UsePermissionsResult {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const userPermissions = await getUserPermissions(session.user.id)
          setPermissions(userPermissions)
        } catch (error) {
          console.error("Error fetching permissions:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [status, session])

  const checkPermission = async (resource: string, action: string): Promise<boolean> => {
    if (status === "unauthenticated" || !session?.user?.id) {
      return false
    }

    try {
      return await hasPermission({
        resource,
        action,
        userId: session.user.id
      })
    } catch (error) {
      console.error("Error checking permission:", error)
      return false
    }
  }

  return {
    hasPermission: checkPermission,
    permissions,
    loading
  }
}

// Hook for checking if user has any of the specified permissions
export function useAnyPermission(requiredPermissions: string[]): boolean {
  const { permissions, loading } = usePermissions()

  if (loading) {
    return false
  }

  return requiredPermissions.some(permission => permissions.includes(permission))
}

// Hook for checking if user has all of the specified permissions
export function useAllPermissions(requiredPermissions: string[]): boolean {
  const { permissions, loading } = usePermissions()

  if (loading) {
    return false
  }

  return requiredPermissions.every(permission => permissions.includes(permission))
}