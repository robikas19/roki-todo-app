"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles, ArrowRight, Mail } from "lucide-react"

export default function VerifyPage() {
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            setVerificationStatus("error")
            setMessage("There was an error verifying your email. Please try again.")
          } else {
            setVerificationStatus("success")
            setMessage("Your email has been successfully verified!")

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push("/dashboard")
            }, 3000)
          }
        } else {
          setVerificationStatus("success")
          setMessage("Your email has been successfully verified!")

          setTimeout(() => {
            router.push("/dashboard")
          }, 3000)
        }
      } catch (error) {
        setVerificationStatus("error")
        setMessage("An unexpected error occurred. Please try again.")
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase.auth, router])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fluid Background */}
      <div className="absolute inset-0 fluid-bg"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-fluid-dark border-0 card-fluid">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 fluid-pulse">
              {verificationStatus === "loading" && (
                <div className="btn-gradient-purple w-full h-full rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
              {verificationStatus === "success" && (
                <div className="btn-gradient-teal w-full h-full rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              )}
              {verificationStatus === "error" && (
                <div className="btn-gradient-orange w-full h-full rounded-2xl flex items-center justify-center">
                  <Mail className="w-10 h-10 text-white" />
                </div>
              )}
            </div>

            <CardTitle className="text-2xl font-bold">
              {verificationStatus === "loading" && (
                <span className="text-gradient-purple">Verifying your email...</span>
              )}
              {verificationStatus === "success" && <span className="text-gradient-teal">Email Verified! 🎉</span>}
              {verificationStatus === "error" && <span className="text-gradient-orange">Verification Error</span>}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <p className="text-gray-200 text-lg">{message}</p>

            {verificationStatus === "success" && (
              <div className="space-y-4">
                <div className="p-4 glass-fluid rounded-lg">
                  <p className="text-gray-300 text-sm">
                    🚀 Welcome to Roki! You'll be redirected to your dashboard in a few seconds.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full btn-gradient-teal transition-all duration-300 transform hover:scale-105"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            )}

            {verificationStatus === "error" && (
              <div className="space-y-4">
                <Button
                  onClick={() => router.push("/auth")}
                  className="w-full btn-gradient-purple transition-all duration-300 transform hover:scale-105"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            )}

            {verificationStatus === "loading" && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
