# NextAuth.js Setup Guide for Wolthers Travel App

This guide documents the complete NextAuth.js authentication setup implemented for the Wolthers Travel App.

## Overview

The authentication system includes:
- Microsoft Azure AD OAuth integration
- Email-based authentication with magic links
- Role-based access control (RBAC)
- Supabase database integration
- TypeScript support with custom session types
- Route protection middleware

## Installation

The following packages have been installed:
- `next-auth@4.24.11` - Core NextAuth.js library
- `@next-auth/supabase-adapter@0.2.1` - Supabase database adapter
- `@types/nodemailer@6.4.17` - TypeScript types for nodemailer

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Microsoft Azure AD OAuth Configuration
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# Email Provider Configuration (SMTP)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@wolthers.com

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Authorized Email Domains (comma-separated)
AUTHORIZED_EMAIL_DOMAINS=wolthers.com,yourdomain.com
```

## Azure AD Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Set the redirect URI to: `http://localhost:3000/api/auth/callback/azure-ad`
5. Copy the Application (client) ID to `AZURE_AD_CLIENT_ID`
6. Copy the Directory (tenant) ID to `AZURE_AD_TENANT_ID`
7. Create a client secret and copy it to `AZURE_AD_CLIENT_SECRET`

## File Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts    # NextAuth API routes
│   ├── auth/
│   │   ├── signin/page.tsx                # Sign-in page
│   │   ├── verify-request/page.tsx        # Email verification page
│   │   └── error/page.tsx                 # Error handling page
│   └── layout.tsx                         # Updated with AuthProvider
├── contexts/
│   └── AuthContext.tsx                    # Auth context and provider
├── hooks/
│   └── useAuth.ts                         # Auth hooks
├── lib/
│   └── auth.ts                           # NextAuth configuration
├── types/
│   ├── index.ts                          # Extended with auth types
│   └── next-auth.d.ts                    # NextAuth type declarations
└── middleware.ts                         # Route protection middleware
```

## Key Components

### 1. Authentication Configuration (`src/lib/auth.ts`)
- Configured Azure AD and Email providers
- Supabase adapter integration
- Custom callbacks for user roles and permissions
- Email templates for magic links

### 2. Auth Context (`src/contexts/AuthContext.tsx`)
- SessionProvider wrapper
- Custom hooks for authentication state
- Role and permission checking utilities

### 3. Authentication Hooks (`src/hooks/useAuth.ts`)
- `useAuth()` - Basic auth state
- `usePermissions()` - Role-based access control
- Utility functions for common auth patterns

### 4. Route Protection (`src/middleware.ts`)
- Protects admin, user management, and fleet routes
- Role-based route access control
- Automatic redirect to sign-in for unauthorized access

### 5. TypeScript Types
- Extended NextAuth session and user types
- Custom interfaces for user profiles and permissions
- Full type safety throughout the auth system

## Authentication Pages

### Sign-in Page (`/auth/signin`)
- Microsoft OAuth sign-in button
- Email magic link form
- Error handling and validation
- Responsive design matching Wolthers branding

### Verify Request Page (`/auth/verify-request`)
- Email verification instructions
- Support contact information
- Back to sign-in navigation

### Error Page (`/auth/error`)
- Comprehensive error handling
- User-friendly error messages
- Recovery options and support links

## User Roles and Permissions

The system supports hierarchical roles:

1. **GLOBAL_ADMIN** - Full system access
2. **WOLTHERS_STAFF** - Wolthers employee access
3. **COMPANY_ADMIN** - Company administration
4. **CLIENT_USER** - Basic client access
5. **DRIVER** - Driver-specific access
6. **GUEST** - Limited guest access

## Database Integration

The system integrates with Supabase and expects the following tables:

### `user_profiles` Table
```sql
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'client_user',
  company_id TEXT,
  permissions JSONB DEFAULT '{}',
  azure_id TEXT,
  preferred_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Examples

### Basic Authentication Check
```tsx
import { useAuth } from "@/hooks/useAuth"

function MyComponent() {
  const { session, isLoading, isAuthenticated } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>
  
  return <div>Welcome, {session?.user?.name}!</div>
}
```

### Role-Based Access Control
```tsx
import { usePermissions } from "@/hooks/useAuth"

function AdminComponent() {
  const { hasRole, canManageUsers } = usePermissions()
  
  if (!hasRole(UserRole.WOLTHERS_STAFF)) {
    return <div>Access denied</div>
  }
  
  return (
    <div>
      <h1>Admin Panel</h1>
      {canManageUsers() && <UserManagement />}
    </div>
  )
}
```

### Protected Route
```tsx
import { useRequireAuth } from "@/contexts/AuthContext"

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useRequireAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return null // Will redirect to sign-in
  
  return <div>Protected content</div>
}
```

## Security Features

1. **JWT-based sessions** with 30-day expiration
2. **Role-based access control** with hierarchical permissions
3. **Email domain restrictions** (optional)
4. **Route protection middleware**
5. **CSRF protection** (built into NextAuth.js)
6. **Secure cookie handling**

## Next Steps

1. **Set up Supabase database tables** for user profiles
2. **Configure Azure AD application** with proper permissions
3. **Set up SMTP email provider** for magic links
4. **Test authentication flow** in development
5. **Configure production environment variables**
6. **Set up user role assignment** workflow

## Troubleshooting

### Common Issues

1. **NEXTAUTH_SECRET not set**: Generate a secret with `openssl rand -base64 32`
2. **Azure AD redirect URI mismatch**: Ensure callback URL matches Azure app registration
3. **Email not sending**: Check SMTP configuration and app passwords
4. **Session not persisting**: Verify NEXTAUTH_URL matches your domain
5. **Type errors**: Ensure all TypeScript declarations are properly imported

### Debug Mode

Enable debug mode in development:
```bash
NEXTAUTH_DEBUG=true npm run dev
```

This will provide detailed logs for troubleshooting authentication issues.