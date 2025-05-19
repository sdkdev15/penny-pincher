
"use client";

import { useCallback, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs
import type { Category } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { useLocalStorage } from "./useLocalStorage";

const CATEGORIES_STORAGE_KEY = "pennyPincherCategories";

export function useCategories() {
  const initialCategoriesValue = useMemo<Category[]>(() => [], []);
  const [categories, setCategories] = useLocalStorage<Category[]>(CATEGORIES_STORAGE_KEY, initialCategoriesValue);

  useEffect(() => {
    // Only set default categories if the stored categories are actually empty
    // This check might be redundant if useLocalStorage correctly returns initialValue only once.
    const storedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!storedCategories || JSON.parse(storedCategories).length === 0) {
      const initialDefaultCategories = DEFAULT_CATEGORIES.map(cat => ({ ...cat, id: uuidv4(), budget: cat.budget || undefined }));
      setCategories(initialDefaultCategories);
    }
  }, [setCategories]); // Ensure setCategories is stable, or this effect might run too often if not.

  const addCategory = useCallback((name: string, budget?: number) => {
    if (name.trim() === "") {
      throw new Error("Category name cannot be empty.");
    }
    setCategories(prev => {
      if (prev.some(cat => cat.name.toLowerCase() === name.trim().toLowerCase())) {
        throw new Error("Category with this name already exists.");
      }
      const newCategory: Category = { 
          id: uuidv4(), 
          name: name.trim(), 
          budget: budget && budget > 0 ? budget : undefined 
      };
      return [...prev, newCategory];
    });
  }, [setCategories]);

  const updateCategory = useCallback((id: string, name: string, budget?: number) => {
    if (name.trim() === "") {
      throw new Error("Category name cannot be empty.");
    }
    setCategories(prev => {
      if (prev.some(cat => cat.id !== id && cat.name.toLowerCase() === name.trim().toLowerCase())) {
        throw new Error("Another category with this name already exists.");
      }
      return prev.map(cat => 
        cat.id === id ? { ...cat, name: name.trim(), budget: budget && budget > 0 ? budget : undefined } : cat
      );
    });
  }, [setCategories]);

  const deleteCategory = useCallback((id: string, associatedTransactionExists: (categoryId: string) => boolean) => {
    setCategories(prev => {
      const categoryToDelete = prev.find(cat => cat.id === id);
      if (categoryToDelete?.isDefault) {
        throw new Error("Default categories cannot be deleted.");
      }
      if (associatedTransactionExists(id)) {
        throw new Error("Cannot delete category with associated transactions. Please reassign them first.");
      }
      return prev.filter(cat => cat.id !== id);
    });
  }, [setCategories]);

  const getCategoryNameById = useCallback((id: string) => {
    // categories might not be initialized on first render if fetched async or from localStorage
    return categories?.find(cat => cat.id === id)?.name || "Uncategorized";
  }, [categories]);
  
  const categoryOptions = useMemo(() => 
    categories.map(cat => ({ value: cat.id, label: cat.name }))
  , [categories]);


  return { categories, addCategory, updateCategory, deleteCategory, getCategoryNameById, categoryOptions };
}

