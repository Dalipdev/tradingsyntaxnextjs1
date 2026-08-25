// app/signin/SignInClient.js
'use client'

import { useContext, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UserContext } from "@/components/Providers"
import UserAuthForm from "@/components/userAuthForm.component"

export default function SignInClient() {
  const { userAuth } = useContext(UserContext)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (userAuth?.access_token) {
      router.replace(redirectTo)
    }
  }, [userAuth, router, redirectTo])

  // Already logged in — render nothing while redirecting
  if (userAuth?.access_token) return null

  return <UserAuthForm type="sign-in" />
}