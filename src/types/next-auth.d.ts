import { DefaultSession, DefaultUser } from "next-auth"
import { UserRole } from "./index"

declare module "next-auth" {
  /**
   * Extend the built-in session type
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: UserRole
      companyId?: string
      permissions?: Record<string, boolean>
      azure_id?: string
      preferred_username?: string
    } & DefaultSession["user"]
  }

  /**
   * Extend the built-in user type
   */
  interface User extends DefaultUser {
    role?: UserRole
    companyId?: string
    permissions?: Record<string, boolean>
    azure_id?: string
    preferred_username?: string
    given_name?: string
    family_name?: string
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the built-in JWT type
   */
  interface JWT {
    id?: string
    role?: UserRole
    companyId?: string
    permissions?: Record<string, boolean>
    azure_id?: string
    preferred_username?: string
  }
}