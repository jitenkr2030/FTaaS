import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding roles and permissions...')

  // Create permissions
  const permissions = await Promise.all([
    // Model permissions
    prisma.permission.upsert({
      where: { name: 'models:read' },
      update: {},
      create: {
        name: 'models:read',
        resource: 'models',
        action: 'read',
        description: 'View models and model details'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'models:create' },
      update: {},
      create: {
        name: 'models:create',
        resource: 'models',
        action: 'create',
        description: 'Create new models'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'models:update' },
      update: {},
      create: {
        name: 'models:update',
        resource: 'models',
        action: 'update',
        description: 'Update existing models'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'models:delete' },
      update: {},
      create: {
        name: 'models:delete',
        resource: 'models',
        action: 'delete',
        description: 'Delete models'
      }
    }),

    // Dataset permissions
    prisma.permission.upsert({
      where: { name: 'datasets:read' },
      update: {},
      create: {
        name: 'datasets:read',
        resource: 'datasets',
        action: 'read',
        description: 'View datasets and dataset details'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'datasets:create' },
      update: {},
      create: {
        name: 'datasets:create',
        resource: 'datasets',
        action: 'create',
        description: 'Create new datasets'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'datasets:update' },
      update: {},
      create: {
        name: 'datasets:update',
        resource: 'datasets',
        action: 'update',
        description: 'Update existing datasets'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'datasets:delete' },
      update: {},
      create: {
        name: 'datasets:delete',
        resource: 'datasets',
        action: 'delete',
        description: 'Delete datasets'
      }
    }),

    // Fine-tuning permissions
    prisma.permission.upsert({
      where: { name: 'fine_tuning:read' },
      update: {},
      create: {
        name: 'fine_tuning:read',
        resource: 'fine_tuning',
        action: 'read',
        description: 'View fine-tuning jobs and details'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'fine_tuning:create' },
      update: {},
      create: {
        name: 'fine_tuning:create',
        resource: 'fine_tuning',
        action: 'create',
        description: 'Create new fine-tuning jobs'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'fine_tuning:update' },
      update: {},
      create: {
        name: 'fine_tuning:update',
        resource: 'fine_tuning',
        action: 'update',
        description: 'Update fine-tuning jobs'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'fine_tuning:delete' },
      update: {},
      create: {
        name: 'fine_tuning:delete',
        resource: 'fine_tuning',
        action: 'delete',
        description: 'Delete fine-tuning jobs'
      }
    }),

    // API Keys permissions
    prisma.permission.upsert({
      where: { name: 'api_keys:read' },
      update: {},
      create: {
        name: 'api_keys:read',
        resource: 'api_keys',
        action: 'read',
        description: 'View API keys'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'api_keys:create' },
      update: {},
      create: {
        name: 'api_keys:create',
        resource: 'api_keys',
        action: 'create',
        description: 'Create new API keys'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'api_keys:update' },
      update: {},
      create: {
        name: 'api_keys:update',
        resource: 'api_keys',
        action: 'update',
        description: 'Update API keys'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'api_keys:delete' },
      update: {},
      create: {
        name: 'api_keys:delete',
        resource: 'api_keys',
        action: 'delete',
        description: 'Delete API keys'
      }
    }),

    // Admin permissions
    prisma.permission.upsert({
      where: { name: 'admin:read' },
      update: {},
      create: {
        name: 'admin:read',
        resource: 'admin',
        action: 'read',
        description: 'Access admin dashboard'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'admin:update' },
      update: {},
      create: {
        name: 'admin:update',
        resource: 'admin',
        action: 'update',
        description: 'Update system settings'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'admin:delete' },
      update: {},
      create: {
        name: 'admin:delete',
        resource: 'admin',
        action: 'delete',
        description: 'Delete system data'
      }
    }),

    // User management permissions
    prisma.permission.upsert({
      where: { name: 'users:read' },
      update: {},
      create: {
        name: 'users:read',
        resource: 'users',
        action: 'read',
        description: 'View users'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'users:update' },
      update: {},
      create: {
        name: 'users:update',
        resource: 'users',
        action: 'update',
        description: 'Update users'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'users:delete' },
      update: {},
      create: {
        name: 'users:delete',
        resource: 'users',
        action: 'delete',
        description: 'Delete users'
      }
    })
  ])

  console.log(`✅ Created ${permissions.length} permissions`)

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Regular user with basic permissions',
        level: 0
      }
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator with elevated permissions',
        level: 1
      }
    }),
    prisma.role.upsert({
      where: { name: 'super_admin' },
      update: {},
      create: {
        name: 'super_admin',
        description: 'Super administrator with all permissions',
        level: 2
      }
    })
  ])

  console.log(`✅ Created ${roles.length} roles`)

  // Assign permissions to roles

  // User role permissions (read-only access)
  const userPermissions = [
    'models:read',
    'datasets:read',
    'fine_tuning:read',
    'api_keys:read'
  ]

  for (const permName of userPermissions) {
    const permission = permissions.find(p => p.name === permName)
    const role = roles.find(r => r.name === 'user')
    
    if (permission && role) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      })
    }
  }

  // Admin role permissions (full access to core features)
  const adminPermissions = [
    'models:read', 'models:create', 'models:update', 'models:delete',
    'datasets:read', 'datasets:create', 'datasets:update', 'datasets:delete',
    'fine_tuning:read', 'fine_tuning:create', 'fine_tuning:update', 'fine_tuning:delete',
    'api_keys:read', 'api_keys:create', 'api_keys:update', 'api_keys:delete',
    'users:read', 'users:update'
  ]

  for (const permName of adminPermissions) {
    const permission = permissions.find(p => p.name === permName)
    const role = roles.find(r => r.name === 'admin')
    
    if (permission && role) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      })
    }
  }

  // Super admin role permissions (all permissions)
  const superAdminPermissions = permissions.map(p => p.name)

  for (const permName of superAdminPermissions) {
    const permission = permissions.find(p => p.name === permName)
    const role = roles.find(r => r.name === 'super_admin')
    
    if (permission && role) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      })
    }
  }

  console.log('✅ Assigned permissions to roles')

  // Assign roles to existing users
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    // Assign user role to all users
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roles.find(r => r.name === 'user')!.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roles.find(r => r.name === 'user')!.id
      }
    })

    // Assign admin role to admin user
    if (user.email === 'admin@example.com') {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: roles.find(r => r.name === 'admin')!.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roles.find(r => r.name === 'admin')!.id
        }
      })
    }
  }

  console.log('✅ Assigned roles to users')
  console.log('🎉 Roles and permissions seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding roles and permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })