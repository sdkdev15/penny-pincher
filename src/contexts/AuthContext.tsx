"use client";

import type { ReactNode } from "react";
import { createContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  isAdmin: boolean; // Add isAdmin to the user type
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check if the user is authenticated on initial load
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include", // Include cookies in the request
        });

        if (response.ok) {
          const data: User = await response.json(); // Ensure the user object includes isAdmin
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = useCallback(
    async (usernameInput: string, passwordInput: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameInput, password: passwordInput }),
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          // alert("Invalid credentials");
          return false;
        }

        // Fetch the user information after successful login
        const userResponse = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.ok) {
          const data: User = await userResponse.json(); // Ensure the user object includes isAdmin
          setUser(data);
          router.push("/");
          return true;
        } else {
          // alert("Failed to fetch user information after login.");
          return false;
        }
      } catch (error) {
        console.error("Login failed:", error);
        // alert("An error occurred during login.");
        return false;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies in the request
      });

      if (response.ok) {
        setUser(null);
        router.push("/login");
      } else {
        // alert("Failed to log out.");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // alert("An error occurred during logout.");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}