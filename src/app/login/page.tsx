"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal"; // Import the Modal component
import { Coins } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter(); // Initialize router for navigation
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // State for redirect loading
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false); // State for error modal
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Error message for the modal

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null); // Clear previous errors

    try {
      const success = await login(username, password);
      if (success) {
        setIsRedirecting(true); // Set redirect loading state
        router.push("/"); // Redirect to the dashboard
      } else {
        setErrorMessage("Invalid username or password. Please try again.");
        setIsErrorModalOpen(true); // Open the error modal
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again later.");
      setIsErrorModalOpen(true); // Open the error modal
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    // Show a loading screen while redirecting
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-lg font-medium text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Coins className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription>Sign in to manage your finances.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Modal */}
      {isErrorModalOpen && (
        <Modal onClose={() => setIsErrorModalOpen(false)}>
          <h2 className="text-xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-gray-800 dark:text-gray-300">{errorMessage}</p>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={() => setIsErrorModalOpen(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}