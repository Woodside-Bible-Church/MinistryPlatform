import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
    accessToken?: string
    firstName?: string
    lastName?: string
    email?: string
    sub?: string
    roles?: string[]
    contactId?: string
    simulation?: {
      type: 'impersonate' | 'roles'
      contactId?: number
      originalUserId?: string
      originalRoles?: string[]
    }
  }

  interface JWT {
    roles?: string[]
    userId?: string
  }
}