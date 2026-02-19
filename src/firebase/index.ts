'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Singleton instances
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    try {
      // In a production Firebase App Hosting environment, the config is automatically provided.
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Firebase not auto-initialized, using provided config. This is normal in development.');
        firebaseApp = initializeApp(firebaseConfig);
      } else {
         console.error('Firebase automatic initialization failed in production.', e);
         // Fallback for production if auto-init fails for some reason
         firebaseApp = initializeApp(firebaseConfig);
      }
    }
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
