"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerifyRequestPage() {
  const searchParams = useSearchParams()
  const provider = searchParams.get("provider")
  const type = searchParams.get("type")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Mail className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Check your email
          </CardTitle>
          <CardDescription>
            {provider === "email" && type === "email" 
              ? "We've sent you a sign-in link"
              : "A verification link has been sent to your email"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-gray-600">
              Click the link in the email to sign in to your account. The link will expire in 24 hours.
            </p>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Didn't receive the email?</strong>
                <br />
                Check your spam folder or try signing in again.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/signin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <p>
              Having trouble? Contact support at{" "}
              <a href="mailto:support@wolthers.com" className="text-emerald-600 hover:underline">
                support@wolthers.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}