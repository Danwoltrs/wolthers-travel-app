# Microsoft Azure AD Authentication Setup

This guide covers the complete setup for Microsoft Azure AD authentication integration with the Wolthers Travel App.

## Azure App Registration Configuration

### 1. Register the Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the application:
   - **Name**: `Wolthers Travel App`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Select `Web` and add:
     - Development: `http://localhost:3000/auth/callback`
     - Staging: `https://wolthers-travel-app.vercel.app/auth/callback`
     - Production: `https://trips.wolthers.com/auth/callback`

### 2. Configure Authentication Settings

After creating the app registration:

1. Go to **Authentication** in the left sidebar
2. Add additional redirect URIs if needed:
   - `http://localhost:3000/auth/callback`
   - `https://wolthers-travel-app.vercel.app/auth/callback`
   - `https://trips.wolthers.com/auth/callback`
3. Under **Implicit grant and hybrid flows**:
   - ✅ Check **Access tokens (used for implicit flows)**
   - ✅ Check **ID tokens (used for implicit and hybrid flows)**
4. Under **Advanced settings**:
   - **Allow public client flows**: `No`
   - **Treat application as a public client**: `No`

### 3. API Permissions

1. Go to **API permissions** in the left sidebar
2. Ensure these Microsoft Graph permissions are present:
   - `User.Read` (Delegated) - Sign in and read user profile
   - `openid` (Delegated) - Sign users in
   - `profile` (Delegated) - View users' basic profile
   - `email` (Delegated) - View users' email address

If any are missing, click **Add a permission** > **Microsoft Graph** > **Delegated permissions** and add them.

3. Click **Grant admin consent** for your organization

### 4. Create Client Secret

1. Go to **Certificates & secrets** in the left sidebar
2. Under **Client secrets**, click **New client secret**
3. Add description: `Wolthers Travel App Secret`
4. Set expiration: `24 months` (recommended)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately - you won't be able to see it again

### 5. Copy Configuration Values

From the **Overview** page, copy these values for your environment variables:

- **Application (client) ID** → `1c7d36c9-ba1a-4116-97d2-19ad95747359`
- **Directory (tenant) ID** → `b8218f6f-5191-4a79-8937-fac3bd38ee1c`  
- **Client secret** (from step 4) → `abf224e2-4d19-4c50-ab00-175d74a18c85`

## Environment Variables Setup

### Development (.env.local)
```bash
# Microsoft Azure AD OAuth
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=6dcd5ead-2afd-4034-8213-7c52cb66b6dd
AZURE_AD_CLIENT_SECRET=abf224e2-4d19-4c50-ab00-175d74a18c85
NEXT_PUBLIC_AZURE_AD_TENANT_ID=b8218f6f-5191-4a79-8937-fac3bd38ee1c
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)
Add these environment variables in your Vercel dashboard:

1. `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` = `1c7d36c9-ba1a-4116-97d2-19ad95747359`
2. `AZURE_AD_CLIENT_SECRET` = `abf224e2-4d19-4c50-ab00-175d74a18c85`
3. `NEXT_PUBLIC_AZURE_AD_TENANT_ID` = `b8218f6f-5191-4a79-8937-fac3bd38ee1c`
4. `NEXT_PUBLIC_APP_URL` = `https://wolthers-travel-app.vercel.app` (staging) or `https://trips.wolthers.com` (production)

## Authentication Flow

### How It Works

1. **User clicks "Sign in with Microsoft"**
   - Redirects to Microsoft OAuth URL
   - User authenticates with their Microsoft account

2. **Microsoft redirects back with authorization code**
   - Callback URL: `/auth/callback?code=...`
   - Code is exchanged for access token server-side

3. **Server processes authentication**
   - Exchanges code for Microsoft Graph access token
   - Fetches user profile from Microsoft Graph
   - Creates/updates user in Supabase database
   - Tracks login event with timezone info

4. **User is logged in**
   - Redirected to `/dashboard`
   - Session established in the app

### Login Tracking Features

The system automatically tracks:
- **Last login timestamp** with user's local timezone
- **Login provider** (Microsoft vs email)
- **User agent** and browser information
- **Audit trail** of all login events in `login_events` table

### Database Schema

The system uses these database tables:

#### `users` table (enhanced)
- `microsoft_oauth_id` - Microsoft user ID
- `last_login_at` - Timestamp of last login
- `last_login_timezone` - User's timezone during last login
- `last_login_provider` - 'microsoft' or 'email'

#### `login_events` table (new)
- Complete audit trail of all login attempts
- Includes timezone, user agent, and provider information
- Supports compliance and security monitoring

## Testing the Integration

### 1. Local Development Testing
```bash
npm run dev
# Navigate to http://localhost:3000
# Click "Sign in with Microsoft"
# Should redirect to Microsoft login, then back to dashboard
```

### 2. Production Testing (Vercel)
```bash
# Deploy to Vercel
# Navigate to https://wolthers-travel-app.vercel.app
# Test Microsoft authentication flow
```

### 3. Domain Migration Testing
Once `trips.wolthers.com` is set up:
- Update Azure App Registration redirect URIs
- Update `NEXT_PUBLIC_APP_URL` environment variable
- Test authentication flow on production domain

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URI exactly matches what's configured in Azure
   - Check for trailing slashes or case sensitivity

2. **"Application not found"**
   - Verify `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` is correct
   - Ensure the app registration exists and is enabled

3. **"Invalid client secret"**
   - Client secret may have expired
   - Generate a new client secret in Azure
   - Update `AZURE_AD_CLIENT_SECRET` environment variable

4. **"Insufficient privileges"**
   - Admin consent may be required for API permissions
   - Go to Azure AD > App registrations > API permissions > Grant admin consent

5. **Token exchange fails**
   - Check that `AZURE_AD_CLIENT_SECRET` is properly set
   - Verify the authorization code hasn't expired

### Debug Mode

Enable debug logging by adding to your environment:
```bash
DEBUG=true
```

This will provide detailed logs of the authentication flow.

## Security Considerations

1. **Client Secret Protection**
   - Never expose client secret in client-side code
   - Use server-side API routes for token exchange
   - Regularly rotate client secrets

2. **Redirect URI Validation**
   - Only register exact redirect URIs you control
   - Use HTTPS for all production redirect URIs

3. **Token Handling**
   - Access tokens are handled server-side only
   - No sensitive tokens stored in browser localStorage

4. **Audit Trail**
   - All login attempts are logged in `login_events` table
   - Include timezone and user agent for security monitoring
   - Support compliance requirements with detailed logging

## Next Steps for Production

1. **Update Azure App Registration**
   - Add `https://trips.wolthers.com/auth/callback` as redirect URI
   - Update any other domain-specific configurations

2. **DNS and Domain Setup**
   - Configure `trips.wolthers.com` to point to your hosting
   - Update `NEXT_PUBLIC_APP_URL` environment variable

3. **SSL Certificate**
   - Ensure HTTPS is properly configured for production domain
   - Test authentication flow on production domain

4. **Monitoring**
   - Set up monitoring for authentication failures
   - Monitor `login_events` table for suspicious activity
   - Set up alerts for authentication errors

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Azure AD authentication logs
3. Check Vercel deployment logs
4. Review browser developer console for client-side errors

The authentication system is now ready for both `https://wolthers-travel-app.vercel.app` and the eventual `https://trips.wolthers.com` domains.