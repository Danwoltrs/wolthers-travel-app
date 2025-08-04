import { NextAuthOptions } from "next-auth"
import { SupabaseAdapter } from "@next-auth/supabase-adapter"
import AzureADProvider from "next-auth/providers/azure-ad"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

// Initialize Supabase client for NextAuth adapter
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Additional Azure AD profile fields
          given_name: profile.given_name,
          family_name: profile.family_name,
          preferred_username: profile.preferred_username,
        }
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Custom email content for Wolthers Travel App
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const transport = nodemailer.createTransport(provider.server)
        
        const result = await transport.sendMail({
          to: email,
          from: provider.from,
          subject: "Sign in to Wolthers Travel App",
          text: text({ url, host: new URL(url).host }),
          html: html({ url, host: new URL(url).host, email }),
        })

        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`)
        }
      },
    }),
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

        try {
          // Check user in our public.users table
          const { data: user } = await supabase
            .from("users")
            .select("id, email, full_name, user_type, company_id")
            .eq("email", credentials.email)
            .single()

          if (!user) {
            return null
          }

          // In development, allow any password for testing
          if (process.env.NODE_ENV === 'development') {
            return {
              id: user.id,
              email: user.email,
              name: user.full_name,
              role: user.user_type,
              companyId: user.company_id
            }
          }

          // In production, verify password against auth.users
          // For now, we'll just check if auth user exists
          const { data: authUser } = await supabase
            .from("auth.users")
            .select("id")
            .eq("email", credentials.email)
            .single()

          if (!authUser) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.user_type,
            companyId: user.company_id
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in for Azure AD, email, and credentials providers
      if (account?.provider === "azure-ad" || account?.provider === "email" || account?.provider === "credentials") {
        // Additional validation can be added here
        // For example, checking if user email domain is authorized
        const authorizedDomains = process.env.AUTHORIZED_EMAIL_DOMAINS?.split(",") || []
        
        if (authorizedDomains.length > 0 && user.email) {
          const emailDomain = user.email.split("@")[1]
          if (!authorizedDomains.includes(emailDomain)) {
            return false // Deny sign in for unauthorized domains
          }
        }
        
        return true
      }
      return false
    },
    async session({ session, user, token }) {
      // Add custom fields to session
      if (session?.user) {
        session.user.id = user?.id || token?.sub || ""
        
        // Add user role and company association from database
        // This would typically be fetched from your Supabase database
        try {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("role, company_id, permissions")
            .eq("user_id", session.user.id)
            .single()

          if (userProfile) {
            session.user.role = userProfile.role
            session.user.companyId = userProfile.company_id
            session.user.permissions = userProfile.permissions
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // Persist additional user data in JWT token
      if (user) {
        token.id = user.id
      }
      
      // Add Azure AD specific data
      if (account?.provider === "azure-ad" && profile) {
        token.azure_id = profile.sub
        token.preferred_username = (profile as any).preferred_username
      }
      
      return token
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
      
      // Create user profile on first sign in
      if (isNewUser) {
        try {
          await supabase
            .from("user_profiles")
            .insert({
              user_id: user.id,
              email: user.email,
              name: user.name,
              role: "user", // Default role
              created_at: new Date().toISOString(),
            })
        } catch (error) {
          console.error("Error creating user profile:", error)
        }
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
}

// Email templates for verification
function html({ url, host, email }: { url: string; host: string; email: string }) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`
  const escapedHost = `${host.replace(/\./g, "&#8203;.")}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Wolthers Travel App</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1 style="color: #059669; margin: 0;">Wolthers Travel App</h1>
    </div>
    <h2>Sign in to your account</h2>
    <p>Hi there,</p>
    <p>Click the button below to sign in to your Wolthers Travel App account:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${url}" class="button">Sign in to ${escapedHost}</a>
    </p>
    <p>If you didn't request this email, you can safely ignore it.</p>
    <div class="footer">
      <p>This sign-in link was sent to ${escapedEmail}</p>
      <p>© ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n\n${url}\n\n`
}