
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback, DependencyList } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { AppUser } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { logUserAction } from '@/lib/audit-log';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: AppUser | null;
  isInitialized: boolean;
  login: (email: string, password_hash: string) => Promise<boolean>;
  logout: () => void;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp; firestore: Firestore; auth: Auth; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const updateUserOnlineStatus = useCallback(async (uid: string, isOnline: boolean) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, { isOnline });
    } catch (error) {
      console.warn(`Could not update online status for user ${uid}:`, error);
    }
  }, [firestore]);
  
  const updateLastLogin = useCallback(async (uid: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
    } catch (error) {
        console.warn(`Could not update last login for user ${uid}:`, error);
    }
  }, [firestore]);


  useEffect(() => {
    if (!auth || !firestore) {
        setIsInitialized(true);
        return;
    }

    // Timeout de segurança: se o Firebase não responder em 5s, libera a tela de login
    const safetyTimeout = setTimeout(() => {
      setIsInitialized((prev) => (prev ? prev : true));
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data() as Omit<AppUser, 'id'>;
                    const currentUser: AppUser = { 
                        id: userDoc.id,
                        ...userData,
                        isOnline: true,
                        photoURL: userData.photoURL || firebaseUser.photoURL,
                    };
                    setAppUser(currentUser);
                    await updateUserOnlineStatus(firebaseUser.uid, true);
                } else {
                     console.warn(`User document not found for uid: ${firebaseUser.uid}. Attempting to create it.`);
                    const newUser: Omit<AppUser, 'id'> = {
                        uid: firebaseUser.uid,
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Usuário',
                        email: firebaseUser.email || '',
                        role: firebaseUser.email === 'adm@adm.com' ? 'admin' : 'client',
                        status: 'active',
                        isOnline: true,
                        photoURL: firebaseUser.photoURL || '',
                        cpf: '',
                        cnpjs: [],
                    };
                    await setDoc(userDocRef, { ...newUser, lastLogin: serverTimestamp() });
                    setAppUser({ ...newUser, id: firebaseUser.uid });
                }
            } catch (serverError: any) {
                console.error("Failed to fetch user document:", serverError);
                setAppUser(null); 
            }
        } else {
            setAppUser(null);
        }
        setIsInitialized(true);
    });

    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        updateUserOnlineStatus(auth.currentUser.uid, false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [auth, firestore, updateUserOnlineStatus]);
  
  useEffect(() => {
    if (isInitialized && !appUser && pathname !== '/login' && pathname !== '/forgot-password') {
      router.push('/login');
    }
  }, [appUser, isInitialized, pathname, router]);

  const login = async (email: string, password_hash: string): Promise<boolean> => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Erro de Serviço', description: 'Serviços de autenticação não disponíveis.' });
      return false;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password_hash);
      await updateLastLogin(userCredential.user.uid);
      await logUserAction(firestore, auth, 'login');
      // A mudança de estado do onAuthStateChanged irá lidar com a atualização do usuário e o redirecionamento.
      router.push('/');
      return true;
    } catch (error: any) {
      if (email === 'adm@adm.com' && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password_hash);
          await updateLastLogin(userCredential.user.uid);
          await logUserAction(firestore, auth, 'login_admin_creation');
          router.push('/');
          return true;
        } catch (creationError: any) {
          const msg = creationError?.code === 'auth/weak-password'
            ? 'A senha deve ter no mínimo 6 caracteres.'
            : 'Não foi possível criar a conta de super-usuário.';
          toast({ variant: 'destructive', title: 'Erro de Admin', description: msg });
          return false;
        }
      }

      console.error('Login failed:', error);
      let description = 'Ocorreu um erro inesperado. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        description = 'Nenhum usuário encontrado com este e-mail.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'A senha está incorreta. Por favor, tente novamente.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde.';
      }

      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: description,
      });
      return false;
    }
  };

  const logout = useCallback(async () => {
    if (auth && auth.currentUser && firestore) {
        await logUserAction(firestore, auth, 'logout');
        await updateUserOnlineStatus(auth.currentUser.uid, false);
        await signOut(auth);
    }
    // onAuthStateChanged irá limpar o usuário e o useEffect irá redirecionar
  }, [auth, firestore, updateUserOnlineStatus]);

  const contextValue = useMemo(() => ({
    firebaseApp,
    firestore,
    auth,
    user: appUser,
    isInitialized,
    login,
    logout,
  }), [firebaseApp, firestore, auth, appUser, isInitialized, login, logout]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => {
  const context = useFirebase();
  return { user: context.user, login: context.login, logout: context.logout, isInitialized: context.isInitialized };
}

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore not available');
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase App not available');
  return firebaseApp;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  const memoized = useMemo(factory, deps);
  
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): { user: AppUser | null; isUserLoading: boolean } => {
  const { user, isInitialized } = useFirebase();
  return { user, isUserLoading: !isInitialized };
};
