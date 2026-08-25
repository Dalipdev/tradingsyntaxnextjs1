'use client'

import { createContext, useEffect, useState, useMemo, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import { lookInSession } from '@/lib/session'

export const UserContext = createContext({
  userAuth: { access_token: null, isAdmin: false, username: null },
  setUserAuth: () => { }
})

export const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => { }
})

export default function Providers({ children }) {
  const [userAuth, setUserAuthState] = useState({ access_token: null, isAdmin: false })
  const [theme, setThemeState] = useState('light')
  const [isHydrated, setIsHydrated] = useState(false)

  const setUserAuth = useCallback((value) => {
    setUserAuthState(value);
  }, []);

  const setTheme = useCallback((value) => {
    setThemeState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        sessionStorage.setItem('theme', next);
      } catch (error) {
        console.error('Failed to persist theme:', error);
      }
      document.documentElement.setAttribute('data-theme', next);
      document.body.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const domTheme = document.documentElement.getAttribute('data-theme');
      if (domTheme === 'dark' || domTheme === 'light') {
        setThemeState(domTheme);
        // FIX: the blocking script in layout.js now sets data-theme
        // on <body> too, so this line is mostly a safety net — but
        // keeping it here ensures <body> stays in sync with <html>
        // even if this effect ever runs before the script does, or
        // if <body>'s attribute gets cleared by something else.
        document.body.setAttribute('data-theme', domTheme);
      }
    } catch (error) {
      console.error('Failed to read theme from DOM:', error);
    }

    const userInSession = lookInSession('user')
    if (userInSession) {
      try {
        setUserAuthState(userInSession)
      } catch (error) {
        console.error('Failed to parse user session:', error)
      }
    }

    setIsHydrated(true)
  }, [])

  const userContextValue = useMemo(
    () => ({ userAuth, setUserAuth }),
    [userAuth, setUserAuth]
  )

  const themeContextValue = useMemo(
    () => ({ theme, setTheme, isHydrated }),
    [theme, setTheme, isHydrated]
  )

  const toastOptions = useMemo(() => ({
    duration: 3000,
    style: {
      background: theme === 'dark' ? '#2A2A2A' : '#F3F3F3',
      color: theme === 'dark' ? '#F3F3F3' : '#242424',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    success: {
      iconTheme: {
        primary: theme === 'dark' ? '#F3F3F3' : '#242424',
        secondary: theme === 'dark' ? '#242424' : '#FFFFFF',
      },
      duration: 2000,
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: theme === 'dark' ? '#242424' : '#FFFFFF',
      },
      duration: 4000,
    },
  }), [theme])

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <UserContext.Provider value={userContextValue}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={toastOptions}
          containerStyle={{
            top: 80,
            zIndex: 9999,
          }}
          gutter={8}
        />
      </UserContext.Provider>
    </ThemeContext.Provider>
  )
}