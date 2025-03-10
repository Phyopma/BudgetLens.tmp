'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from 'next-auth';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signIn: (credentials?: Record<string, string>) => Promise<any>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (credentials?: Record<string, string>) => {
    try {
      setError(null);
      const result = await signIn('credentials', {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return { error: result.error };
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign out';
      setError(errorMessage);
    }
  };

  const value = {
    session,
    status,
    signIn: handleSignIn,
    signOut: handleSignOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}