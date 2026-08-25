// app/settings/edit-profile/page.js

'use client'

import { useContext, useState, useCallback, useEffect, useTransition, useRef } from 'react'
import { UserContext } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AnimationWrapper from '@/lib/page-animation'
import Loader from '@/components/loader.component'
import { toast } from 'react-hot-toast'
import { uploadImage } from '@/lib/aws'

const SOCIAL_PLATFORMS = [
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@username', icon: 'fi-brands-youtube' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username', icon: 'fi-brands-instagram' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username', icon: 'fi-brands-facebook' },
  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username', icon: 'fi-brands-twitter' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username', icon: 'fi-brands-github' },
  { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com', icon: 'fi-rr-globe' },
]

const EditProfilePage = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef(null)
  
  const { userAuth, setUserAuth } = useContext(UserContext)
  const access_token = userAuth?.access_token

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState({})

  const [profile, setProfile] = useState({
    fullname: '',
    username: '',
    email: '',
    bio: '',
    profile_img: '',
    social_links: {
      youtube: '',
      instagram: '',
      facebook: '',
      twitter: '',
      github: '',
      website: '',
    },
  })

  const [originalProfile, setOriginalProfile] = useState(null)

  // Redirect to signin immediately if not authenticated without leaving
  // a stale settings entry in the browser history.
  useEffect(() => {
    if (access_token === null) {
      router.replace('/signin')
    }
  }, [access_token, router])

  // Optimized fetch profile with native fetch
  useEffect(() => {
    if (!access_token || !userAuth?.username) return

    const fetchProfile = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/get-profile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({ username: userAuth.username }),
            cache: 'no-store',
          }
        )

        if (!response.ok) throw new Error('Failed to load profile')

        const data = await response.json()

        const profileData = {
          fullname: data.personal_info?.fullname || '',
          username: data.personal_info?.username || '',
          email: data.personal_info?.email || '',
          bio: data.personal_info?.bio || '',
          profile_img: data.personal_info?.profile_img || '',
          social_links: data.social_links || {
            youtube: '',
            instagram: '',
            facebook: '',
            twitter: '',
            github: '',
            website: '',
          },
        }

        setProfile(profileData)
        setOriginalProfile(profileData)

      } catch (err) {
        console.error('Error fetching profile:', err)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [access_token, userAuth?.username])

  // Check if profile has changes
  useEffect(() => {
    if (!originalProfile) return
    
    const changed = JSON.stringify(profile) !== JSON.stringify(originalProfile)
    setHasChanges(changed)
  }, [profile, originalProfile])

  // Optimized image upload
  const handleProfileImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size should be less than 5MB')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return toast.error('Please select a valid image file')
    }

    setIsUploadingImage(true)
    const uploadingToast = toast.loading('Uploading image...')

    try {
      // Show preview immediately (optimistic)
      const reader = new FileReader()
      reader.onload = (e) => {
        startTransition(() => {
          setProfile(prev => ({ ...prev, profile_img: e.target.result }))
        })
      }
      reader.readAsDataURL(file)

      // Upload to server
      const url = await uploadImage(file)
      
      startTransition(() => {
        setProfile(prev => ({ ...prev, profile_img: url }))
      })

      toast.dismiss(uploadingToast)
      toast.success('Image uploaded successfully! 📸')

    } catch (err) {
      console.error('Upload error:', err)
      toast.dismiss(uploadingToast)
      toast.error('Failed to upload image')
      
      // Revert to original
      startTransition(() => {
        setProfile(prev => ({ ...prev, profile_img: originalProfile.profile_img }))
      })
    } finally {
      setIsUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [originalProfile])

  // Real-time validation
  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'fullname':
        if (!value.trim()) return 'Full name is required'
        if (value.length < 3) return 'Full name must be at least 3 characters'
        break
      
      case 'username':
        if (!value.trim()) return 'Username is required'
        if (value.length < 3) return 'Username must be at least 3 characters'
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
        break
      
      case 'bio':
        if (value.length > 150) return 'Bio cannot exceed 150 characters'
        break
    }
    return null
  }, [])

  // Optimized input change
  const handleInputChange = useCallback((field, value) => {
    startTransition(() => {
      setProfile(prev => ({ ...prev, [field]: value }))
      
      // Clear error when typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }))
      }
    })
  }, [errors])

  // Handle blur for validation
  const handleBlur = useCallback((field, value) => {
    const error = validateField(field, value)
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [validateField])

  // Optimized social link change
  const handleSocialLinkChange = useCallback((platform, value) => {
    startTransition(() => {
      setProfile(prev => ({
        ...prev,
        social_links: { ...prev.social_links, [platform]: value },
      }))
    })
  }, [])

  // Validate URL
  const isValidUrl = useCallback((url) => {
    if (!url) return true // Empty is valid
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, [])

  // Optimized save profile with native fetch
  const handleSaveProfile = useCallback(async (e) => {
    e?.preventDefault()

    if (isSaving) return

    // Validate all fields
    const newErrors = {}
    
    const fullnameError = validateField('fullname', profile.fullname)
    if (fullnameError) newErrors.fullname = fullnameError
    
    const usernameError = validateField('username', profile.username)
    if (usernameError) newErrors.username = usernameError
    
    const bioError = validateField('bio', profile.bio)
    if (bioError) newErrors.bio = bioError

    // Validate social links
    Object.entries(profile.social_links).forEach(([key, value]) => {
      if (value && !isValidUrl(value)) {
        newErrors[`social_${key}`] = 'Invalid URL format'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors before saving')
      return
    }

    setIsSaving(true)
    const savingToast = toast.loading('Saving profile...')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            username: profile.username,
            fullname: profile.fullname,
            email: profile.email,
            bio: profile.bio,
            social_links: profile.social_links,
            profile_img: profile.profile_img,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const data = await response.json()

      // Update user context
      setUserAuth(prev => ({
        ...prev,
        profile_img: data.profile_img || prev.profile_img,
        username: data.username || prev.username,
        fullname: data.fullname || prev.fullname,
      }))

      // Update original profile
      setOriginalProfile(profile)
      setHasChanges(false)

      toast.dismiss(savingToast)
      toast.success('Profile updated successfully! 🎉')

    } catch (err) {
      console.error('Error saving profile:', err)
      toast.dismiss(savingToast)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }, [profile, access_token, isSaving, setUserAuth, validateField, isValidUrl])

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    if (originalProfile) {
      setProfile(originalProfile)
      setErrors({})
      setHasChanges(false)
      toast.success('Changes discarded')
    }
  }, [originalProfile])

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  if (access_token === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <AnimationWrapper>
      <section className="w-full max-w-4xl mx-auto px-4 md:px-0">
        {/* Header row: hidden entirely on mobile (title already shows in
            the SideNav top bar there). Previously only the <h1> was
            hidden while this wrapping flex row kept its mb-6 margin,
            leaving a small residual gap above "Profile Picture". */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <h1>Edit Profile</h1>
          {hasChanges && (
            <span className="text-sm text-orange-500 flex items-center gap-2">
              <i className="fi fi-rr-info"></i>
              Unsaved changes
            </span>
          )}
        </div>

        {/* Mobile-only unsaved-changes indicator, shown inline above the
            form instead of inside the now-hidden header row. */}
        {hasChanges && (
          <div className="md:hidden mb-4">
            <span className="text-sm text-orange-500 flex items-center gap-2">
              <i className="fi fi-rr-info"></i>
              Unsaved changes
            </span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="max-w-2xl">
          {/* Profile Image Upload */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex gap-5 items-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-grey">
                {profile.profile_img ? (
                  <Image
                    src={profile.profile_img}
                    alt="Profile"
                    fill
                    sizes="96px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-dark-grey">
                    <i className="fi fi-rr-user"></i>
                  </div>
                )}
              </div>
              
              <div>
                <label className="relative cursor-pointer">
                  <button
                    type="button"
                    className="btn-light disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Change Image'
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploadingImage}
                  />
                </label>
                <p className="text-xs text-dark-grey mt-2">
                  JPG, PNG or GIF. Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

            <div className="mb-4">
              <label className="block text-black mb-2 font-medium">
                Full Name *
              </label>
              <input
                type="text"
                value={profile.fullname}
                onChange={(e) => handleInputChange('fullname', e.target.value)}
                onBlur={(e) => handleBlur('fullname', e.target.value)}
                placeholder="Full Name"
                className={`input-box ${errors.fullname ? 'border-red-500' : ''}`}
                disabled={isSaving}
              />
              {errors.fullname && (
                <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-black mb-2 font-medium">
                Username *
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                onBlur={(e) => handleBlur('username', e.target.value)}
                placeholder="Username"
                className={`input-box ${errors.username ? 'border-red-500' : ''}`}
                disabled={isSaving}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-black mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                placeholder="Email"
                className="input-box opacity-75 cursor-not-allowed bg-grey/30"
              />
              <p className="text-sm text-dark-grey mt-2">
                Email cannot be changed
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-black mb-2 font-medium">
                Bio ({profile.bio.length}/150)
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value.slice(0, 150))}
                onBlur={(e) => handleBlur('bio', e.target.value)}
                placeholder="Tell us about yourself"
                maxLength="150"
                className={`input-box resize-none h-24 ${errors.bio ? 'border-red-500' : ''}`}
                disabled={isSaving}
              />
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>

            <div className="space-y-4">
              {SOCIAL_PLATFORMS.map(({ key, label, placeholder, icon }) => (
                <div key={key}>
                  <label className="block text-black mb-2 font-medium flex items-center gap-2">
                    <i className={`fi ${icon}`}></i>
                    {label}
                  </label>
                  <input
                    type="url"
                    value={profile.social_links[key] || ''}
                    onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                    placeholder={placeholder}
                    className={`input-box ${errors[`social_${key}`] ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {errors[`social_${key}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`social_${key}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              type="submit"
              disabled={isSaving || !hasChanges || isPending}
              className="btn-dark px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="btn-light px-8 disabled:opacity-50"
              >
                Discard
              </button>
            )}
          </div>
        </form>
      </section>
    </AnimationWrapper>
  )
}

export default EditProfilePage