// app/settings/change-password/page.js

'use client'

import { useContext, useState, useCallback, useEffect, useTransition } from 'react'
import { UserContext } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import AnimationWrapper from '@/lib/page-animation'
import Loader from '@/components/loader.component'
import { toast } from 'react-hot-toast'
import InputBox from '@/components/input.component'

const ChangePasswordPage = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const { userAuth } = useContext(UserContext)
  const access_token = userAuth?.access_token

  const [isLoading, setIsLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [errors, setErrors] = useState({})

  // Redirect to signin immediately if not authenticated without leaving
  // a stale settings entry in the browser history.
  useEffect(() => {
    if (access_token === null) {
      router.replace('/signin')
    }
  }, [access_token, router])

  // Real-time validation
  const validateField = useCallback((field, value) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/
    
    switch (field) {
      case 'currentPassword':
        if (!value.trim()) {
          return 'Current password is required'
        }
        break
      
      case 'newPassword':
        if (!value.trim()) {
          return 'New password is required'
        }
        if (!passwordRegex.test(value)) {
          return 'Must be 6-20 characters with number, lowercase & uppercase'
        }
        if (value === passwords.currentPassword) {
          return 'New password must be different from current password'
        }
        break
      
      case 'confirmPassword':
        if (!value.trim()) {
          return 'Please confirm your password'
        }
        if (value !== passwords.newPassword) {
          return 'Passwords do not match'
        }
        break
    }
    
    return null
  }, [passwords.currentPassword, passwords.newPassword])

  // Optimized input change handler with validation
  const handleInputChange = useCallback((field, value) => {
    startTransition(() => {
      setPasswords((prev) => ({ ...prev, [field]: value }))
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }))
      }
    })
  }, [errors])

  // Handle input blur for validation
  const handleBlur = useCallback((field) => {
    const error = validateField(field, passwords[field])
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [passwords, validateField])

  // Toggle password visibility
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }, [])

  // Optimized password change with native fetch
  const handleChangePassword = useCallback(async (e) => {
    e?.preventDefault()
    
    if (isLoading) return

    // Validate all fields
    const newErrors = {}
    Object.keys(passwords).forEach(field => {
      const error = validateField(field, passwords[field])
      if (error) newErrors[field] = error
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors before submitting')
      return
    }

    setIsLoading(true)
    const changingToast = toast.loading('Changing password...')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.dismiss(changingToast)
      toast.success('Password changed successfully! 🎉')

      // Reset form
      startTransition(() => {
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setErrors({})
      })

      // Optional: Redirect to profile after success
      // setTimeout(() => router.push('/settings'), 1500)

    } catch (err) {
      console.error('Error changing password:', err)
      toast.dismiss(changingToast)
      toast.error(err.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }, [passwords, access_token, isLoading, validateField])

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleChangePassword(e)
    }
  }, [handleChangePassword, isLoading])

  // Password strength indicator
  const getPasswordStrength = useCallback((password) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 2, label: 'Weak', color: 'bg-red-500' },
      { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, label: 'Good', color: 'bg-blue-500' },
      { strength: 5, label: 'Strong', color: 'bg-green-500' },
      { strength: 6, label: 'Very Strong', color: 'bg-green-600' },
    ]

    return levels.find(l => l.strength <= strength) || levels[0]
  }, [])

  const passwordStrength = getPasswordStrength(passwords.newPassword)

  if (access_token === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <AnimationWrapper>
      <section className="w-full max-w-4xl mx-auto px-4 md:px-0">
        {/* Title hidden on mobile (already shown in SideNav top bar there).
            Margin lives on the h1 itself so it fully collapses to zero
            when hidden — no wrapping element left holding a stray margin. */}
        <h1 className="hidden md:block mb-6">Change Password</h1>

        <form 
          onSubmit={handleChangePassword}
          className="max-w-md"
          onKeyPress={handleKeyPress}
        >
          {/* Current Password */}
          <div className="mb-6">
            <label className="block text-dark-grey mb-2 font-medium">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwords.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                onBlur={() => handleBlur('currentPassword')}
                placeholder="Enter current password"
                className={`input-box pr-12 ${errors.currentPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-grey hover:text-black"
                tabIndex={-1}
              >
                <i className={`fi ${showPasswords.current ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-xl`}></i>
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="mb-6">
            <label className="block text-dark-grey mb-2 font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                onBlur={() => handleBlur('newPassword')}
                placeholder="Enter new password"
                className={`input-box pr-12 ${errors.newPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-grey hover:text-black"
                tabIndex={-1}
              >
                <i className={`fi ${showPasswords.new ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-xl`}></i>
              </button>
            </div>
            
            {/* Password strength indicator */}
            {passwords.newPassword && !errors.newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.strength
                          ? passwordStrength.color
                          : 'bg-grey'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.label && (
                  <p className="text-sm text-dark-grey">
                    Strength: {passwordStrength.label}
                  </p>
                )}
              </div>
            )}
            
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
            
            <p className="text-sm text-dark-grey mt-2">
              Must be 6-20 characters with number, lowercase & uppercase letters
            </p>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-dark-grey mb-2 font-medium">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Confirm new password"
                className={`input-box pr-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-grey hover:text-black"
                tabIndex={-1}
              >
                <i className={`fi ${showPasswords.confirm ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-xl`}></i>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
            {passwords.confirmPassword && !errors.confirmPassword && passwords.confirmPassword === passwords.newPassword && (
              <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                <i className="fi fi-rr-check-circle"></i>
                Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isPending}
            className="btn-dark px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </section>
    </AnimationWrapper>
  )
}

export default ChangePasswordPage