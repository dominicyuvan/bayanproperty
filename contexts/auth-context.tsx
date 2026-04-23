'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import { deserializeUser } from '@/lib/user-doc'
import type { User, UserRole } from '@/lib/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  initialized: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  /** Reload `users/{uid}` from Firestore into context (e.g. after profile or avatar update). */
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // If Firebase is not configured or auth is null, stop loading
    if (!isFirebaseConfigured) {
      setLoading(false)
      setInitialized(true)
      return () => {}
    }

    if (!auth) {
      setLoading(false)
      setInitialized(true)
      return () => {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      // Auth state is known at this point; avoid blocking the UI on Firestore calls.
      setLoading(false)
      setInitialized(true)
      
      if (fbUser && db) {
        // Set a provisional profile immediately to avoid redirect races.
        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          phone: '',
          nameEn: fbUser.displayName || '',
          nameAr: '',
          role: 'tenant',
          languagePreference: 'en',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
          if (userDoc.exists()) {
            setUser(deserializeUser(fbUser.uid, userDoc.data() as Record<string, unknown>))
          } else {
            // Backfill a profile for users that exist in Auth but not in Firestore.
            const fallbackUser: Omit<User, 'id'> = {
              email: fbUser.email || '',
              phone: '',
              nameEn: fbUser.displayName || '',
              nameAr: '',
              role: 'tenant',
              languagePreference: 'en',
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            await setDoc(doc(db, 'users', fbUser.uid), fallbackUser)
            setUser({ id: fbUser.uid, ...fallbackUser })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Keep a minimal authenticated user shape so protected routes can render.
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            phone: '',
            nameEn: fbUser.displayName || '',
            nameAr: '',
            role: 'tenant',
            languagePreference: 'en',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    if (!auth || !db) throw new Error('Firebase not configured')
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Create user document in Firestore
    const newUser: Omit<User, 'id'> = {
      email,
      phone: userData.phone || '',
      nameEn: userData.nameEn || '',
      nameAr: userData.nameAr || userData.nameEn || '',
      role: (userData.role as UserRole) || 'tenant',
      languagePreference: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    await setDoc(doc(db, 'users', credential.user.uid), newUser)
    setUser({ id: credential.user.uid, ...newUser })
  }

  const signOut = async () => {
    if (!auth) return
    await firebaseSignOut(auth)
    setUser(null)
  }

  const refreshUserProfile = useCallback(async () => {
    const fb = auth?.currentUser
    if (!fb || !db) return
    try {
      const userDoc = await getDoc(doc(db, 'users', fb.uid))
      if (userDoc.exists()) {
        setUser(deserializeUser(fb.uid, userDoc.data() as Record<string, unknown>))
      }
    } catch (e) {
      console.error('refreshUserProfile', e)
    }
  }, [])

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase not configured')
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        initialized,
        isConfigured: isFirebaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
