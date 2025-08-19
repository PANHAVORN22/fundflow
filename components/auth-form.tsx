"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export default function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { toast } = useToast()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: email.split("@")[0], // Use email prefix as default name
            },
          },
        })

        if (error) {
          console.error("Signup error:", error)
          throw error
        }

        // If signup successful but no session (email confirmation required)
        if (data.user && !data.session) {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          })
          // Switch to sign in mode after successful signup
          setIsSignUp(false)
        } else if (data.session) {
          // If signup successful with immediate session
          toast({
            title: "Welcome to Fundflow!",
            description: "Your account has been created successfully.",
          })
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) {
          console.error("Signin error:", error)
          throw error
        }

        if (data.user) {
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          })
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      let errorMessage = "An unexpected error occurred. Please try again."

      // Handle specific error cases
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again."
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please check your email and click the confirmation link before signing in."
      } else if (error.message.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Try signing in instead."
        setIsSignUp(false) // Switch to sign in mode
      } else if (error.message.includes("Database error")) {
        errorMessage = "There was a problem creating your account. Please try again or contact support."
      } else if (error.message.includes("signup disabled")) {
        errorMessage = "New registrations are currently disabled. Please contact support."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: isSignUp ? "Signup Error" : "Sign In Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error("Google Auth error:", error)
      toast({
        title: "Google Sign In Error",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#6B8E5A] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-200 border-0 rounded-3xl">
        <CardHeader className="text-center pb-6">
          <div className="text-[#6B8E5A] text-4xl font-bold italic mb-4">Fundflow</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
          <p className="text-gray-600 text-sm">
            {isSignUp
              ? "Create your account to start tracking donations"
              : "Continue by logging in or signing up with Fundflow"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleAuth}
            variant="outline"
            className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full py-6"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center">
            <Separator className="flex-1" />
            <span className="px-3 text-gray-500 text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="bg-white border-gray-300 rounded-full py-6"
            />
            <Input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6}
              className="bg-white border-gray-300 rounded-full py-6"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6B8E5A] hover:bg-[#5A7A4A] text-white rounded-full py-6"
            >
              {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>

          {isSignUp && (
            <div className="text-xs text-gray-600 text-center bg-blue-50 p-3 rounded-lg">
              <strong>Note:</strong> You'll receive an email confirmation link after creating your account. Please check
              your email and click the link to activate your account.
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            This site is protected by reCAPTCHA and the Google{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Terms of Service
            </a>{" "}
            apply.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
