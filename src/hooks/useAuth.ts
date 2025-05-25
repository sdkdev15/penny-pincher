"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, ...rest } = context;

  return {
    ...rest,
    user,
    isAdmin: user?.isAdmin || false, 
  };
}