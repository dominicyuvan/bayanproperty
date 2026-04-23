import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyCK71VqvNVXozzAyJ7k1_dAI9xL9zQ7fSg',
  authDomain: 'bayan-property.firebaseapp.com',
  projectId: 'bayan-property',
  storageBucket: 'bayan-property.firebasestorage.app',
  messagingSenderId: '44301137046',
  appId: '1:44301137046:web:82943825ed424fe8cb3eb7',
}

const normalize = (value: string | undefined) => value?.trim() || undefined

const firebaseConfig = {
  apiKey: normalize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || defaultFirebaseConfig.apiKey,
  authDomain: normalize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || defaultFirebaseConfig.authDomain,
  projectId: normalize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || defaultFirebaseConfig.projectId,
  storageBucket:
    normalize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    normalize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || defaultFirebaseConfig.messagingSenderId,
  appId: normalize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || defaultFirebaseConfig.appId,
}

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
)

// Initialize Firebase only if configured
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, db, storage }
export default app
