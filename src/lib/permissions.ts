import { db } from '@/lib/db'

export interface PermissionCheck {
  resource: string
  action: string
  userId?: string
  userRoles?: any[]
}

export async function hasPermission({ resource, action, userId, userRoles }: PermissionCheck): Promise<boolean> {
  if (!userId && !userRoles) {
    return false
  }

  try {
    // If userRoles are provided, use them directly
    if (userRoles && userRoles.length > 0) {
      const roleIds = userRoles.map(role => role.roleId)
      return await checkRolePermissions(roleIds, resource, action)
    }

    // Otherwise, fetch user roles from database
    if (userId) {
      const roles = await db.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      })

      if (roles.length === 0) {
        return false
      }

      // Check if any role has the required permission
      for (const userRole of roles) {
        const role = userRole.role
        for (const rolePermission of role.rolePermissions) {
          const permission = rolePermission.permission
          if (permission.resource === resource && permission.action === action) {
            return true
          }
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

async function checkRolePermissions(roleIds: string[], resource: string, action: string): Promise<boolean> {
  const rolePermissions = await db.rolePermission.findMany({
    where: {
      roleId: { in: roleIds }
    },
    include: {
      permission: true
    }
  })

  return rolePermissions.some(rp => 
    rp.permission.resource === resource && rp.permission.action === action
  )
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userRoles = await db.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    const permissions: string[] = []
    
    for (const userRole of userRoles) {
      const role = userRole.role
      for (const rolePermission of role.rolePermissions) {
        const permission = rolePermission.permission
        permissions.push(`${permission.resource}:${permission.action}`)
      }
    }

    return [...new Set(permissions)] // Remove duplicates
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

export async function getUserRoles(userId: string) {
  try {
    const userRoles = await db.userRole.findMany({
      where: { userId },
      include: {
        role: true
      }
    })

    return userRoles.map(ur => ur.role)
  } catch (error) {
    console.error('Error getting user roles:', error)
    return []
  }
}

export async function assignRoleToUser(userId: string, roleName: string) {
  try {
    const role = await db.role.findUnique({
      where: { name: roleName }
    })

    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    // Check if user already has this role
    const existingUserRole = await db.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      }
    })

    if (existingUserRole) {
      return existingUserRole
    }

    const userRole = await db.userRole.create({
      data: {
        userId,
        roleId: role.id
      }
    })

    return userRole
  } catch (error) {
    console.error('Error assigning role to user:', error)
    throw error
  }
}

export async function removeRoleFromUser(userId: string, roleName: string) {
  try {
    const role = await db.role.findUnique({
      where: { name: roleName }
    })

    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    const deletedUserRole = await db.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id
      }
    })

    return deletedUserRole
  } catch (error) {
    console.error('Error removing role from user:', error)
    throw error
  }
}

export async function createPermission(name: string, resource: string, action: string, description?: string) {
  try {
    const permission = await db.permission.create({
      data: {
        name,
        resource,
        action,
        description
      }
    })

    return permission
  } catch (error) {
    console.error('Error creating permission:', error)
    throw error
  }
}

export async function createRole(name: string, description?: string, level: number = 0) {
  try {
    const role = await db.role.create({
      data: {
        name,
        description,
        level
      }
    })

    return role
  } catch (error) {
    console.error('Error creating role:', error)
    throw error
  }
}

export async function assignPermissionToRole(roleName: string, permissionName: string) {
  try {
    const role = await db.role.findUnique({
      where: { name: roleName }
    })

    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    const permission = await db.permission.findUnique({
      where: { name: permissionName }
    })

    if (!permission) {
      throw new Error(`Permission ${permissionName} not found`)
    }

    // Check if permission is already assigned to role
    const existingRolePermission = await db.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id
        }
      }
    })

    if (existingRolePermission) {
      return existingRolePermission
    }

    const rolePermission = await db.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id
      }
    })

    return rolePermission
  } catch (error) {
    console.error('Error assigning permission to role:', error)
    throw error
  }
}