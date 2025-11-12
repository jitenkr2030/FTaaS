import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      emailVerified?: boolean
      provider?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    emailVerified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    emailVerified?: boolean
    provider?: string
  }
}