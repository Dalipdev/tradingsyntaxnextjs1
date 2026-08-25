// context/AuthContext.js

'use client'; // For Next.js 13+ App Router

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getAuthInstance } from '@/lib/firebase';
import { storeInSession, removeFromSession, logOutUser } from '@/lib/session';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(userData);
        storeInSession('user', userData);
      } else {
        setUser(null);
        removeFromSession('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};