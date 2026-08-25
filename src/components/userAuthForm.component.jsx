'use client'

import { useContext, useState, useCallback, useMemo, useEffect } from "react"
import InputBox from "@/components/input.component"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import axios from "axios"
import { storeInSession } from "@/lib/session"
import { UserContext } from "@/components/Providers"
import { authWithGoogle } from "@/lib/firebase"
import Image from "next/image"

// FIX: every consumer of auth state (Navbar, SignInClient, SignUpClient,
// this form's own `access_token` check) expects EXACTLY this shape:
//   { access_token, isAdmin, profile_img, ...whatever else }
// If the backend response uses different field names (token vs
// access_token, role:"admin" vs isAdmin, avatar vs profile_img, or wraps
// everything in { user: {...} }), setUserAuth(response.data) still
// "succeeds" with no error — it just stores an object whose
// `.access_token` is undefined, so every UI that checks `access_token`
// silently renders as logged-out. This normalizer accepts the common
// variations and always emits the shape the app actually expects, so a
// backend field-name mismatch can never again fail silently.
const normalizeAuthResponse = (raw) => {
  if (!raw || typeof raw !== "object") return raw

  // Some APIs wrap the payload, e.g. { user: {...} } or { data: {...} }
  const src = raw.user && typeof raw.user === "object" ? raw.user : raw

  const access_token =
    src.access_token ?? src.accessToken ?? src.token ?? src.jwt ?? null

  const isAdmin =
    src.isAdmin ??
    src.is_admin ??
    (typeof src.role === "string" ? src.role.toLowerCase() === "admin" : undefined) ??
    false

  const profile_img =
    src.profile_img ?? src.profileImage ?? src.avatar ?? src.photoURL ?? null

  const username =
    src.username ??
    src.userName ??
    src.user_name ??
    src.name ??
    src.full_name ??
    src.fullName ??
    src.email?.split('@')[0] ??
    null

  const normalized = {
    ...src,
    access_token,
    isAdmin,
    profile_img,
    username,
  }

  if (!access_token) {
    // Loud, explicit signal instead of a silent "logged out after login"
    // bug — check this in the console if auth ever breaks again.
    console.warn(
      "[auth] No access_token found in server response after normalization. " +
        "Raw response was:",
      raw,
      "Expected one of: access_token, accessToken, token, jwt (optionally nested under `user`).",
    )
  }

  return normalized
}

const UserAuthForm = ({ type }) => {
  const { userAuth, setUserAuth } = useContext(UserContext)
  const access_token = userAuth?.access_token
  const [isSubmitting, setIsSubmitting] = useState(false)
  // NEW: flips on if the request is still pending after a few seconds,
  // so we can tell the user the server is cold-starting on Render's
  // free tier instead of leaving them staring at a frozen button.
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (access_token && typeof window !== 'undefined') {
      router.replace('/')
    }
  }, [access_token, router])

  const emailRegex = useMemo(() => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, [])
  const passwordRegex = useMemo(() => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/, [])

  const userAuthThroughServer = useCallback(async (serverRoute, formData) => {
    const fullURL = process.env.NEXT_PUBLIC_SERVER_DOMAIN + serverRoute

    // If the request is still going after 4s, assume it's a Render
    // cold start and let the user know rather than leaving them guessing.
    const slowTimer = setTimeout(() => setIsSlowConnection(true), 4000)

    try {
      const response = await axios.post(fullURL, formData, {
        // Increased from 30s -> 2 min. Render's free tier can take
        // 50s-2min to spin a sleeping backend back up; 30s was
        // aborting the request right as the server was waking up.
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // FIX: normalize BEFORE storing/setting, so sessionStorage and
      // React context always agree with each other and with what the
      // rest of the app expects — regardless of the backend's exact
      // field names.
      const authData = normalizeAuthResponse(response.data)

      if (!authData.access_token) {
        // Don't pretend this was a success if we truly have no token —
        // this is very likely a backend contract mismatch, not a real
        // login failure, but we can't safely proceed without a token.
        toast.error("Signed in, but the server response was missing an access token. Check the console for details.")
        setIsSubmitting(false)
        return
      }

      storeInSession("user", authData)
      setUserAuth(authData)

      toast.success("Authentication successful!")

      router.replace("/")
      router.refresh()

    } catch (err) {
      console.error('Auth error:', err)

      if (err.code === 'ECONNABORTED') {
        toast.error("Server is taking too long to respond. Please try again in a moment.")
      } else if (err.response?.status === 401) {
        toast.error("Invalid credentials. Please try again.")
      } else if (err.response?.status === 409) {
        toast.error("Email already exists. Please sign in instead.")
      } else if (err.response?.status === 429) {
        toast.error("Too many attempts. Please try again later.")
      } else if (err.response) {
        const message = err.response.data?.error || "Authentication failed."
        toast.error(message)
      } else if (err.request) {
        toast.error("No response from server. Please check your connection.")
      } else {
        toast.error("Something went wrong. Please try again.")
      }

      setIsSubmitting(false)
    } finally {
      clearTimeout(slowTimer)
      setIsSlowConnection(false)
    }
  }, [setUserAuth, router])

  const validateForm = useCallback((formDataObj, type) => {
    const { fullname, email, password } = formDataObj

    if (type !== "sign-in") {
      if (!fullname || fullname.trim().length === 0) {
        toast.error("Please enter your full name.")
        return false
      }
      if (fullname.trim().length < 3) {
        toast.error("Full name must be at least 3 characters.")
        return false
      }
      if (fullname.trim().length > 50) {
        toast.error("Full name must be less than 50 characters.")
        return false
      }
      if (!/^[a-zA-Z\s]+$/.test(fullname.trim())) {
        toast.error("Full name can only contain letters and spaces.")
        return false
      }
    }

    if (!email || email.trim().length === 0) {
      toast.error("Please enter your email address.")
      return false
    }

    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.")
      return false
    }

    if (!password || password.length === 0) {
      toast.error("Please enter your password.")
      return false
    }

    if (!passwordRegex.test(password)) {
      toast.error("Password must be 6-20 characters with at least one number, one lowercase and one uppercase letter.")
      return false
    }

    return true
  }, [emailRegex, passwordRegex])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    const serverRoute = type === "sign-in" ? "/signin" : "/signup"

    const formData = new FormData(e.target)
    const formDataObj = Object.fromEntries(formData.entries())

    if (!validateForm(formDataObj, type)) {
      setIsSubmitting(false)
      return
    }

    const sanitizedData = {
      ...formDataObj,
      email: formDataObj.email.trim().toLowerCase(),
      fullname: formDataObj.fullname?.trim()
    }

    await userAuthThroughServer(serverRoute, sanitizedData)
  }, [isSubmitting, type, validateForm, userAuthThroughServer])

  const handleGoogleAuth = useCallback(async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const user = await authWithGoogle()

      if (!user || !user.accessToken) {
        toast.error("Google sign-in failed. Please try again.")
        setIsSubmitting(false)
        return
      }

      const serverRoute = "/google-auth"
      const formData = {
        access_token: user.accessToken
      }

      await userAuthThroughServer(serverRoute, formData)
    } catch (err) {
      console.error("Google auth error:", err)

      if (err.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in cancelled. Please try again.")
      } else if (err.code === 'auth/popup-blocked') {
        toast.error("Popup blocked. Please allow popups and try again.")
      } else {
        toast.error("Google sign-in failed. Please try again.")
      }

      setIsSubmitting(false)
    }
  }, [isSubmitting, userAuthThroughServer])

  const formTitle = useMemo(() => {
    return type === "sign-in" ? "Welcome back" : "Join us today"
  }, [type])

  // Now accounts for the slow-connection state so the button text
  // reflects what's actually happening during a Render cold start.
  const submitButtonText = useMemo(() => {
    if (isSlowConnection) return "Waking up server, please wait..."
    if (isSubmitting) return "Processing..."
    return type === "sign-in" ? "Sign In" : "Sign Up"
  }, [isSubmitting, isSlowConnection, type])

  if (access_token) {
    return (
      <section className="h-cover flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-dark-grey">Redirecting to home...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="h-cover flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-[80%] max-w-[400px]"
        noValidate
      >
        <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
          {formTitle}
        </h1>

        {type !== "sign-in" && (
          <InputBox
            name="fullname"
            type="text"
            placeholder="Full Name"
            icon="fi-rr-user"
            disabled={isSubmitting}
            autoComplete="name"
            required
          />
        )}

        <InputBox
          name="email"
          type="email"
          placeholder="Email"
          icon="fi-rr-envelope"
          disabled={isSubmitting}
          autoComplete="email"
          required
        />

        <InputBox
          name="password"
          type="password"
          placeholder="Password"
          icon="fi-rr-key"
          disabled={isSubmitting}
          autoComplete={type === "sign-in" ? "current-password" : "new-password"}
          required
        />

        {type !== "sign-in" && (
          <p className="text-xs text-dark-grey mt-2 mb-4 px-1">
            Password must be 6-20 characters with at least one number, one lowercase and one uppercase letter.
          </p>
        )}

        {/* NEW: inline hint that appears once the slow-connection
            threshold is hit, in addition to the button text change,
            so the message is visible even if the button is off-screen. */}
        {isSlowConnection && (
          <p className="text-xs text-center mt-3 text-dark-grey">
            The server is waking up from sleep — this can take up to a minute on first request.
          </p>
        )}

        <button
          className="btn-dark center mt-14 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              {submitButtonText}
            </span>
          ) : submitButtonText}
        </button>

        <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
          <hr className="w-1/2 border-black" />
          <p className="text-xs">or</p>
          <hr className="w-1/2 border-black" />
        </div>

        <button
          className="btn-dark flex items-center justify-center gap-4 center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          type="button"
          aria-label="Continue with Google"
        >
          <Image
            src="/imgs/google.png"
            alt=""
            width={20}
            height={20}
            className="object-contain"
            priority
          />
          <span className="capitalize">Continue with Google</span>
        </button>

        {type === "sign-in" ? (
          <p className="mt-6 text-dark-grey text-xl text-center">
            Don&apos;t have an account?
            <Link
              href="/signup"
              className="underline text-black text-xl ml-1 hover:text-grey transition-colors"
              prefetch={true}
            >
              Join us today
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-dark-grey text-xl text-center">
            Already a member?
            <Link
              href="/signin"
              className="underline text-black text-xl ml-1 hover:text-grey transition-colors"
              prefetch={true}
            >
              Sign in here
            </Link>
          </p>
        )}
      </form>
    </section>
  )
}

export default UserAuthForm