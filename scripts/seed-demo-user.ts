import { db } from '../src/lib/db'

async function seedDemoUser() {
  try {
    // Check if demo user exists
    const existingUser = await db.user.findUnique({
      where: {
        email: 'demo@ftaas.com'
      }
    })

    if (existingUser) {
      console.log('Demo user already exists:', existingUser)
      return
    }

    // Create demo user
    const demoUser = await db.user.create({
      data: {
        email: 'demo@ftaas.com',
        name: 'Demo User'
      }
    })

    console.log('Demo user created successfully:', demoUser)
  } catch (error) {
    console.error('Error seeding demo user:', error)
  } finally {
    await db.$disconnect()
  }
}

seedDemoUser()