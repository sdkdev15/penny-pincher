"use client";

import type { ReactNode } from "react";
import { createContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data: User = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = useCallback(
    async (usernameInput: string, passwordInput: string): Promise<boolean> => {
      setError(null);
      
      if (!usernameInput || !passwordInput) {
        setError("Username and password are required.");
        return false;
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameInput, password: passwordInput }),
          credentials: "include",
        });

        const data = await response.json().catch(() => ({ message: "Login failed." }));

        if (!response.ok) {
          setError(data.message || "Invalid credentials.");
          return false;
        }

        // Fetch the user information after successful login
        const userResponse = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData: User = await userResponse.json();
          setUser(userData);
          router.push("/");
          return true;
        } else {
          setError("Failed to fetch user information after login.");
          return false;
        }
      } catch (err) {
        console.error("Login failed:", err);
        setError("An error occurred during login. Please try again.");
        return false;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        setError(null);
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
