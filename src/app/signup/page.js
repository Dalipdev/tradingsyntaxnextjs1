// app/signup/SignUpClient.js
'use client'

import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserContext } from "@/components/Providers"
import UserAuthForm from "@/components/userAuthForm.component"

export default function SignUpPage() {
  const { userAuth } = useContext(UserContext)
  const router = useRouter()

  useEffect(() => {
    if (userAuth?.access_token) {
      router.replace("/")
    }
  }, [userAuth, router])

  // Already logged in — render nothing while redirecting
  if (userAuth?.access_token) return null

  return <UserAuthForm type="sign-up" />
}