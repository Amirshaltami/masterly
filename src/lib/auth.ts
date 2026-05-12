import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { increment, isBlocked, reset } from "@/lib/rateLimiter"
import { sendWelcomeEmailGoogle } from "@/lib/mail"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

function hasRealValue(value?: string) {
  if (!value) return false
  return !value.startsWith("your_") && !value.includes("change-this")
}

const isGoogleConfigured = hasRealValue(googleClientId) && hasRealValue(googleClientSecret)

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const emailKey = `login:${credentials.email}`
      // Block if too many failed attempts
      if (isBlocked(emailKey, 5)) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email
        }
      })
      if (!user) {
        console.warn(`Auth: no user found for ${credentials.email}`)
        increment(emailKey)
        return null
      }

      if (!user.password) {
        console.warn(`Auth: user ${credentials.email} has no password set`)
        increment(emailKey)
        return null
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

      if (!isPasswordValid) {
        console.warn(`Auth: invalid password for ${credentials.email}`)
        increment(emailKey)
        return null
      }

      // successful login -> reset counter
      reset(emailKey)

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    }
  })
]

if (isGoogleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  session: {
    strategy: "jwt",
    // Keep sessions reasonably short; NIST suggests limiting session lifetime
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Send welcome email only on first Google sign-in (account creation)
      if (account?.provider === "google" && user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
            select: { createdAt: true },
          })
          // createdAt within the last 10 seconds means this is a brand-new account
          const isNew =
            existing &&
            Date.now() - new Date(existing.createdAt).getTime() < 10_000
          if (isNew) {
            await sendWelcomeEmailGoogle(user.email, user.name).catch((e) =>
              console.error("Failed to send Google welcome email:", e)
            )
          }
        } catch (e) {
          console.error("signIn callback error:", e)
        }
        // Force Google users through role selection before entering the app.
        return "/onboarding/role"
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session?.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
  },
}