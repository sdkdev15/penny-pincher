"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all categories from the API
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/process/categories", {
        credentials: "include", // Include cookies in the request
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories.");
      }

      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new category via the API
  const addCategory = useCallback(
    async (name: string, budget?: number) => {
      if (name.trim() === "") {
        throw new Error("Category name cannot be empty.");
      }

      try {
        const response = await fetch("/api/process/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies in the request
          body: JSON.stringify({ name, budget }),
        });

        if (!response.ok) {
          throw new Error("Failed to add category.");
        }

        const newCategory: Category = await response.json();
        setCategories((prev) => [...prev, newCategory]);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Update an existing category via the API
  const updateCategory = useCallback(
    async (id: string, name: string, budget?: number) => {
      if (name.trim() === "") {
        throw new Error("Category name cannot be empty.");
      }

      try {
        const response = await fetch(`/api/process/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies in the request
          body: JSON.stringify({ name, budget }),
        });

        if (!response.ok) {
          throw new Error("Failed to update category.");
        }

        const updatedCategory: Category = await response.json();
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? updatedCategory : cat))
        );
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Delete a category via the API
  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/process/categories/${id}`, {
          method: "DELETE",
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          throw new Error("Failed to delete category.");
        }

        setCategories((prev) => prev.filter((cat) => cat.id !== id));
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Get a category name by ID
  const getCategoryNameById = useCallback(
    (id: string) => {
      return categories.find((cat) => cat.id === id)?.name || "Uncategorized";
    },
    [categories]
  );

  // Generate category options for dropdowns
  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryNameById,
    categoryOptions,
  };
}