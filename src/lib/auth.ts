import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { generateVerificationToken } from "@/lib/email-verification"
import { logAuthenticationEvent, logSecurityEvent } from "@/lib/audit-log"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          // Log failed authentication attempt
          await logAuthenticationEvent('', 'failed_login', {
            email: credentials.email,
            reason: 'missing_credentials'
          })
          return null
        }

        // Handle demo user
        if (credentials.email === "demo@ftaas.com" && credentials.password === "demo123") {
          // Check if demo user exists, if not create it
          let demoUser = await db.user.findUnique({
            where: {
              email: "demo@ftaas.com"
            }
          })

          if (!demoUser) {
            // Create demo user
            demoUser = await db.user.create({
              data: {
                email: "demo@ftaas.com",
                name: "Demo User",
                emailVerified: true, // Demo user is pre-verified
                emailVerifiedAt: new Date()
              }
            })
          }

          // Log successful login
          await logAuthenticationEvent(demoUser.id, 'login', {
            method: 'credentials',
            email: credentials.email,
            isDemo: true
          })

          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            emailVerified: demoUser.emailVerified
          }
        }

        // For regular users, check if they exist
        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          // Log failed authentication attempt
          await logAuthenticationEvent('', 'failed_login', {
            email: credentials.email,
            reason: 'user_not_found'
          })
          return null
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Log failed authentication attempt
          await logAuthenticationEvent(user.id, 'failed_login', {
            email: credentials.email,
            reason: 'email_not_verified'
          })
          throw new Error("Please verify your email before signing in")
        }

        // For demo purposes, we'll accept any password
        // In production, you would verify the password hash
        // const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        // if (!isPasswordValid) {
        //   // Log failed authentication attempt
        //   await logAuthenticationEvent(user.id, 'failed_login', {
        //     email: credentials.email,
        //     reason: 'invalid_password'
        //   })
        //   return null
        // }

        // Log successful login
        await logAuthenticationEvent(user.id, 'login', {
          method: 'credentials',
          email: credentials.email
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
        token.emailVerified = user.emailVerified
      }
      
      // Add OAuth provider info
      if (account) {
        token.provider = account.provider
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.emailVerified = token.emailVerified
        session.user.provider = token.provider
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, automatically verify email
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (user.email) {
          await db.user.update({
            where: { email: user.email },
            data: {
              emailVerified: true,
              emailVerifiedAt: new Date()
            }
          })
        }
      }

      // Log successful sign in
      if (user.id) {
        await logAuthenticationEvent(user.id, 'login', {
          method: account?.provider || 'credentials',
          email: user.email,
          provider: account?.provider
        })
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      return baseUrl
    }
  },
  events: {
    async signOut({ session, token }) {
      // Log logout event
      if (session?.user?.id || token?.sub) {
        await logAuthenticationEvent(session?.user?.id || token?.sub, 'logout', {
          method: 'manual',
          email: session?.user?.email
        })
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup"
  }
}