"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast";

type User = {
  id: string;
  username: string;
  isAdmin: boolean;
};

export default function UserManagementPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", isAdmin: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // New: Change password modal state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/auth/users", {
          credentials: "include",
        });
        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        showToast("Failed to load users.", "destructive");
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  async function handleAddUser() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser),
      });
      const { user: createdUser }: { user: User } = await response.json();
      setUsers((prev) => [...prev, createdUser]);
      setIsModalOpen(false);
      showToast("User added successfully!", "default");
    } catch (error) {
      console.error("Failed to add user:", error);
      showToast("Failed to add user.", "destructive");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await fetch(`/api/auth/delete/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      showToast("User deleted successfully!", "default");
    } catch (error) {
      console.error("Failed to delete user:", error);
      showToast("Failed to delete user.", "destructive");
    } finally {
      setIsDeleteModalOpen(false);
    }
  }

  // New: Handle password change
  async function handleChangePassword() {
    if (!userToChangePassword) return;
    if (newPassword.trim().length < 6) {
      showToast("Password must be at least 6 characters.", "destructive");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPassword, userId: userToChangePassword.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password.");
      }

      setIsChangePasswordModalOpen(false);
      setNewPassword("");
      setUserToChangePassword(null);
      showToast("Password reset successfully!", "default");
    } catch (error: any) {
      console.error("Failed to reset password:", error);
      showToast(error.message || "Failed to reset password.", "destructive");
    } finally {
      setIsChangingPassword(false);
    }
  }

  function showToast(message: string, variant: "default" | "destructive") {
    setToastMessage(message);
    setToastVariant(variant);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="rounded-md space-y-6 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setIsModalOpen(true)}>Add User</Button>
        </div>

        <Table className="w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <td className="px-6 py-4 text-gray-800 dark:text-gray-300">{user.username}</td>
                <td className="px-6 py-4">
                  {user.isAdmin ? (
                    <Badge variant="success">Admin</Badge>
                  ) : (
                    <Badge variant="default">User</Badge>
                  )}
                </td>
                <td className="px-6 py-4 space-x-2">
                  <Button
                    variant="destructive"
                    className="text-sm"
                    onClick={() => {
                      setUserToDelete(user);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() => {
                      setUserToChangePassword(user);
                      setIsChangePasswordModalOpen(true);
                      setNewPassword("");
                    }}
                  >
                    Change Password
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Add User Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark">Add New User</h2>
            <div className="space-y-4">
              <Input
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              <Input
                placeholder="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <label className="flex items-center space-x-2 text-gray-900 dark:text-dark">
                <input
                  type="checkbox"
                  checked={newUser.isAdmin}
                  onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                />
                <span>Admin</span>
              </label>
              <div className="flex justify-end space-x-4 pt-2 text-gray-900 dark:text-dark">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add User"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && userToDelete && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark">Confirm Deletion</h2>
            <p className="text-gray-800 dark:text-gray">
              Are you sure you want to delete the user "{userToDelete.username}"?
            </p>
            <div className="flex justify-end space-x-4 mt-4 text-gray-900 dark:text-dark">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteUser(userToDelete.id)}>
                Delete
              </Button>
            </div>
          </Modal>
        )}

        {/* Change Password Modal */}
        {isChangePasswordModalOpen && userToChangePassword && (
          <Modal onClose={() => setIsChangePasswordModalOpen(false)}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark">
              Change Password for "{userToChangePassword.username}"
            </h2>
            <Input
              placeholder="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex justify-end space-x-4 pt-4 text-gray-900 dark:text-dark">
              <Button variant="ghost" onClick={() => setIsChangePasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </Modal>
        )}
      </div>

      {toastMessage && (
        <Toast variant={toastVariant}>
          <ToastTitle>{toastVariant === "default" ? "Success" : "Error"}</ToastTitle>
          <ToastDescription>{toastMessage}</ToastDescription>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
}
