"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There was an issue with the server configuration. Please contact support."
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You don't have permission to access this application. Please contact your administrator."
  },
  Verification: {
    title: "Verification Failed",
    description: "The verification link has expired or is invalid. Please try signing in again."
  },
  OAuthSignin: {
    title: "OAuth Sign-in Error",
    description: "There was a problem signing in with your OAuth provider. Please try again."
  },
  OAuthCallback: {
    title: "OAuth Callback Error", 
    description: "There was a problem processing the OAuth callback. Please try again."
  },
  OAuthCreateAccount: {
    title: "Account Creation Failed",
    description: "Could not create your account. Please try again or contact support."
  },
  EmailCreateAccount: {
    title: "Email Account Creation Failed",
    description: "Could not create account with this email. Please try again."
  },
  Callback: {
    title: "Callback Error",
    description: "There was a problem with the authentication callback. Please try again."
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "This email is already associated with another account. Please sign in with your original method."
  },
  EmailSignin: {
    title: "Email Sign-in Error",
    description: "Could not send the email. Please check your email address and try again."
  },
  CredentialsSignin: {
    title: "Invalid Credentials",
    description: "The credentials you provided are incorrect. Please try again."
  },
  SessionRequired: {
    title: "Session Required",
    description: "You must be signed in to access this page."
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication. Please try again."
  }
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  
  const errorInfo = errorMessages[error || "Default"] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription>
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Error Code:</strong> {error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/auth/signin">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              If this problem persists, please contact support at{" "}
              <a 
                href="mailto:support@wolthers.com" 
                className="text-emerald-600 hover:underline"
              >
                support@wolthers.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <AuthErrorContent />
    </Suspense>
  )
}