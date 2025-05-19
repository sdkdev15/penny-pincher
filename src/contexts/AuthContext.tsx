
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null;
  isLoading: boolean;
  login: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pennyPincherAuth';

interface StoredAuthState {
  isAuthenticated: boolean;
  user: { username: string } | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialAuthState = useMemo<StoredAuthState>(() => ({
    isAuthenticated: false,
    user: null,
  }), []);

  const [storedAuthState, setStoredAuthState] = useLocalStorage<StoredAuthState>(
    AUTH_STORAGE_KEY,
    initialAuthState
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Derived state from localStorage for easier usage
  const isAuthenticated = storedAuthState.isAuthenticated;
  const user = storedAuthState.user;

  useEffect(() => {
    setIsLoading(false); // Initial load from localStorage is synchronous in useLocalStorage hook
  }, []);
  
  const login = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    // Hardcoded credentials for demo purposes
    if (usernameInput === 'penny' && passwordInput === 'admin') {
      setStoredAuthState({ isAuthenticated: true, user: { username: usernameInput } });
      router.push('/');
      return true;
    }
    alert('Invalid credentials');
    return false;
  }, [setStoredAuthState, router]);

  const logout = useCallback(() => {
    setStoredAuthState({ isAuthenticated: false, user: null });
    router.push('/login');
  }, [setStoredAuthState, router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
