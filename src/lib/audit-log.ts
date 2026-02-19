
'use client';

import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

/**
 * Logs a user action to the 'auditLogs' collection in Firestore.
 *
 * @param firestore - The Firestore instance.
 * @param auth - The Auth instance.
 * @param action - A string identifying the action (e.g., 'login', 'create_document').
 * @param details - An object containing additional context about the action.
 */
export async function logUserAction(
  firestore: Firestore,
  auth: Auth,
  action: string,
  details: Record<string, any> = {}
) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('Cannot log action: No user is authenticated.');
    return;
  }

  try {
    await addDoc(collection(firestore, 'auditLogs'), {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email,
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to write to audit log:', error);
    // We don't re-throw or show a toast here to avoid interrupting the user's main action.
  }
}
