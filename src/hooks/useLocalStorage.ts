
"use client";

import { useState, useEffect, useCallback } from "react";

// This function is a utility to safely parse JSON
function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (jsonString === null) {
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(jsonString);
    // Ensure that if defaultValue is an array and parsed is not, we return defaultValue
    // This can help prevent errors if localStorage somehow stores a non-array where an array is expected.
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        // console.warn(`Expected array from localStorage for key, but got non-array. Returning default.`);
        return defaultValue;
    }
    return parsed as T;
  } catch (error) {
    // console.warn("Error parsing JSON from localStorage", error);
    return defaultValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // Don't return initialValue if item is null but initialValue is, for example, an empty array from a memoized source.
      // Let safeJsonParse handle the null item case.
      return safeJsonParse<T>(item, initialValue);
    } catch (error) {
      // console.error(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // console.error(\`Error setting localStorage key "\${key}":\`, error);
    }
  }, [key, storedValue]); // storedValue dependency is important for the functional update `value(storedValue)`
  
  // Effect to update state if localStorage changes in another tab/window
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        // When event.newValue is null, it means the key was removed or cleared.
        // In this case, we should revert to the initialValue.
        setStoredValue(safeJsonParse<T>(event.newValue, initialValue));
      }
    };
    
    // Listen to storage changes
    window.addEventListener("storage", handleStorageChange);
    
    // Initial sync:
    // This ensures that if the value was changed in another tab before this hook mounted,
    // or if the initial server render had a different idea of the state, we sync up.
    // This might be slightly redundant with the useState initializer if initialValue is stable
    // and localStorage hasn't changed, but it's safer.
    const currentItem = window.localStorage.getItem(key);
    const currentValueInStorage = safeJsonParse<T>(currentItem, initialValue);

    // Only update if the current state differs from what's in storage,
    // to avoid potential unnecessary re-renders if initialValue was already correct.
    // This comparison needs to be careful with objects/arrays. A simple stringify might be okay for basic cases.
    if (JSON.stringify(storedValue) !== JSON.stringify(currentValueInStorage)) {
        setStoredValue(currentValueInStorage);
    }
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  // initialValue is a dependency. If it's an object/array, it MUST be stable (e.g., from useMemo)
  // otherwise this effect will run on every render, potentially causing a loop.
  }, [key, initialValue, storedValue]); // Added storedValue to dependencies of outer useEffect to refine sync logic.


  return [storedValue, setValue];
}

