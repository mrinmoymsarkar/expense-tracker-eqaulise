'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Spinner } from '@/components/icons';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Dynamic import keeps firebase off the server — getAuth uses localStorage
    Promise.all([import('@/lib/firebase'), import('firebase/auth')]).then(
      ([{ auth }, { onAuthStateChanged }]) => {
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            import('@/lib/db/user')
              .then(({ ensureUserProfile }) => ensureUserProfile(firebaseUser))
              .catch(console.error);
          }
          setUser(firebaseUser);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <Spinner className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
