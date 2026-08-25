// lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const getFirebaseConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

// ✅ Nothing runs at import time — all lazy
let appInstance = null;
let authInstance = null;

const getAppInstance = () => {
  if (!appInstance) {
    appInstance = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
  }
  return appInstance;
};

export const getAuthInstance = () => {
  if (typeof window === 'undefined') return null;
  if (!authInstance) {
    authInstance = getAuth(getAppInstance());
  }
  return authInstance;
};

// ✅ Only initializes when user clicks Google Sign-In
export const authWithGoogle = async () => {
  if (typeof window === 'undefined') return null;

  try {
    const auth = getAuthInstance();
    if (!auth) throw new Error('Firebase Auth not initialized');

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      accessToken: result._tokenResponse?.idToken || null,
    };

  } catch (error) {
    console.error("Google Sign-In Error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('User closed the popup');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('Multiple popup requests');
    } else if (error.code === 'auth/popup-blocked') {
      console.error('Popup was blocked by browser');
    }
    return null;
  }
};

export const signOutUser = async () => {
  try {
    const auth = getAuthInstance();
    if (!auth) return false;
    await auth.signOut();
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
};

export const getCurrentUser = () => {
  const auth = getAuthInstance();
  return auth?.currentUser || null;
};

export const onAuthStateChanged = (callback) => {
  if (typeof window === 'undefined') return () => { };
  const auth = getAuthInstance();
  if (!auth) return () => { };
  return auth.onAuthStateChanged(callback);
};

export const getIdToken = async (forceRefresh = false) => {
  try {
    const auth = getAuthInstance();
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

export const isFirebaseInitialized = () => getApps().length > 0;