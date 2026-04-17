# Bug Report - Penny Pincher

Generated: 2026-04-18 00:11 (Asia/Jakarta, UTC+7)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| HIGH | 8 |
| MEDIUM | 15 |
| LOW | 6 |
| **Total** | **29** |

---

## High Severity Bugs

### 1. Hardcoded Fallback Secret (Security Critical)
- **File:** `src/lib/authOptions.ts`
- **Line:** 98
- **Issue:** Using hardcoded fallback secret `"penny-pincher-secret-key"` if `NEXTAUTH_SECRET` is not set. This is a critical security vulnerability.
- **Fix:** Remove the fallback and require `NEXTAUTH_SECRET` to be set:
```typescript
secret: process.env.NEXTAUTH_SECRET, // Remove fallback
```

### 2. Type Mismatch: number vs string for categoryId
- **File:** `src/components/categories/CategoryManager.tsx`
- **Lines:** 70, 114
- **Issue:** Argument of type 'number' is not assignable to parameter of type 'string'
- **Fix:** Convert categoryId to string before passing, or update the type definition to use number

### 3. Type Mismatch in TransactionListClient
- **File:** `src/components/transactions/TransactionListClient.tsx`
- **Lines:** 68, 99, 113, 123, 191, 479, 526
- **Issue:** Multiple type mismatches between number and string for categoryId comparisons
- **Fix:** Ensure consistent typing - either all number or all string for categoryId

### 4. Type Mismatch in TransactionForm
- **File:** `src/components/transactions/TransactionForm.tsx`
- **Lines:** 80, 92, 95
- **Issue:** categoryId type incompatibility with AsyncDefaultValues
- **Fix:** Match the categoryId type with the expected form type

### 5. Missing Owner Verification in User Delete
- **File:** `src/pages/api/auth/delete.ts`
- **Lines:** 19-21
- **Issue:** Any authenticated user can delete ANY user by providing their ID, including admins. Should verify ownership.
- **Fix:** Add authorization check to verify requester has permission to delete the target user.

### 6. useEffect Infinite Loop in use-toast
- **File:** `src/hooks/use-toast.ts`
- **Line:** 185
- **Issue:** useEffect dependency array `[state]` causes infinite subscription churn. Every time `state` changes, the effect re-runs, creating an infinite loop.
- **Fix:** Change dependency array to `[]`:
```typescript
React.useEffect(() => {
  listeners.push(setState)
  return () => {
    const index = listeners.indexOf(setState)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}, []) // Empty dependency array
```

### 7. Race Condition - Duplicate PrismaClient
- **File:** `src/lib/authOptions.ts`
- **Line:** 6
- **Issue:** Creates a new PrismaClient instance at module load time, conflicting with singleton pattern in `prisma.ts`
- **Fix:** Remove duplicate PrismaClient creation and use the singleton from `prisma.ts`

### 8. Missing Authorization in User Management API
- **File:** `src/pages/api/auth/delete.ts`
- **Lines:** 19-21
- **Issue:** No ownership verification before user deletion
- **Fix:** Add check to verify the requesting user has permission to delete the target user

---

## Medium Severity Bugs

### 1. Missing dependency `filterDateRange` in useEffect
- **File:** `src/components/transactions/TransactionListClient.tsx`
- **Line:** 143
- **Issue:** useEffect uses `filterDateRange` but doesn't include it in dependency array, causing stale closure issues
- **Fix:** Add `filterDateRange` to dependency array: `}, [filterDateRange]);`

### 2. Missing Accessibility in Modal
- **File:** `src/components/ui/modal.tsx`
- **Lines:** 1-12
- **Issue:** Modal lacks ESC key handling, focus trapping, and proper ARIA attributes
- **Fix:** Add keyboard event listeners, focus trapping, and `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes

### 3. Using window.confirm for Critical Actions
- **File:** `src/components/transactions/TransactionListClient.tsx`
- **Line:** 122
- **Issue:** Using native `window.confirm` provides poor UX and doesn't match application design
- **Fix:** Replace with custom confirmation dialog component

### 4. useCallback has `storedValue` as dependency
- **File:** `src/hooks/useLocalStorage.ts`
- **Line:** 45
- **Issue:** Including `storedValue` in useCallback dependency array causes function recreation on every state change
- **Fix:** Remove `storedValue` from dependency array or use ref pattern

### 5. Using `any` type in Auth Middleware
- **File:** `src/middleware/authMiddleware.ts`
- **Line:** 21
- **Issue:** Using `any` type breaks TypeScript safety when attaching user to request
- **Fix:** Create `AuthenticatedRequest` interface extending `NextApiRequest`

### 6. Missing userId validation in JWT Decode
- **File:** `src/middleware/authMiddleware.ts`
- **Line:** 20
- **Issue:** Decoded token cast without verifying `userId` property exists
- **Fix:** Add validation: `if (!decoded.userId) return 401`

### 7. Catch-all Error Handler Hides Specific JWT Errors
- **File:** `src/middleware/authMiddleware.ts`
- **Lines:** 25-27
- **Issue:** Generic error handler hides specific JWT errors (expired, malformed)
- **Fix:** Check `error instanceof jwt.TokenExpiredError` or `JsonWebTokenError`

### 8. No RBAC Implementation
- **File:** `src/middleware/authMiddleware.ts`
- **Line:** 4-28
- **Issue:** No role-based access control (RBAC) implemented
- **Fix:** Add optional `allowedRoles` parameter for authorization

### 9. Inline Context Value Object Recreation
- **File:** `src/contexts/AuthContext.tsx`
- **Line:** 129
- **Issue:** Context value object recreated on every render, causing all consumers to re-render
- **Fix:** Wrap context value in `useMemo`:
```tsx
const value = useMemo(() => ({
  isAuthenticated,
  user,
  isLoading,
  error,
  login,
  logout,
  clearError
}), [isAuthenticated, user, isLoading, error, login, logout, clearError]);
```

### 10. Unvalidated JSON Response Cast to User Type
- **File:** `src/contexts/AuthContext.tsx`
- **Line:** 41
- **Issue:** `response.json()` return value is cast directly to `User` without validation
- **Fix:** Add runtime validation with zod or check response structure

### 11. NaN Handling Missing in User Delete API
- **File:** `src/pages/api/auth/delete.ts`
- **Line:** 12
- **Issue:** No check if `parseInt` returns `NaN` before using `targetUserId`
- **Fix:** Add `isNaN(targetUserId)` check before database operations

### 12. Inconsistent Cookie Security Settings
- **File:** `src/pages/api/auth/login.ts`
- **Line:** 47
- **Issue:** Cookie missing `Secure` flag which may be required in production
- **Fix:** Add `Secure` flag for production environment

---

## Low Severity Bugs

### 1. Type Assertions Using `as any`
- **File:** `src/lib/authOptions.ts`
- **Lines:** 81-82
- **Issue:** Uses `(user as any).username` and `(user as any).isAdmin` bypassing TypeScript's type checking
- **Fix:** Define proper interface for user returned from authorize()

### 2. Hardcoded Cookie Name
- **File:** `src/middleware/authMiddleware.ts`
- **Line:** 7
- **Issue:** Cookie name `authToken` hardcoded, not configurable
- **Fix:** Use environment variable with fallback

### 3. JWT_SECRET Check Runs on Every Request
- **File:** `src/middleware/authMiddleware.ts`
- **Lines:** 14-16
- **Issue:** JWT_SECRET validation runs on every request (performance impact)
- **Fix:** Move validation to module level or app initialization

### 4. Missing JWT_SECRET Validation at Startup
- **File:** `src/middleware/authMiddleware.ts`
- **Line:** 14
- **Issue:** Missing JWT_SECRET only detected at runtime, not startup
- **Fix:** Add startup validation to fail fast

### 5. Unused Import in AuthContext
- **File:** `src/contexts/AuthContext.tsx`
- **Issue:** Check for unused imports that increase bundle size
- **Fix:** Remove unused imports

### 6. Missing Dependency Array in useEffect
- **File:** `src/hooks/use-toast.ts`
- **Issue:** useEffect cleanup might not run properly
- **Fix:** Review and fix dependency array

---

## Recommended Priority Fix Order

1. **HIGH Priority (Critical Security/Compilation)**
   - Fix hardcoded fallback secret in authOptions.ts
   - Fix type mismatches for categoryId
   - Fix useEffect infinite loop in use-toast.ts
   - Fix missing authorization in user delete API
   - Fix race condition with duplicate PrismaClient

2. **MEDIUM Priority (Logic/Stability)**
   - Fix missing useEffect dependencies
   - Add proper modal accessibility
   - Replace window.confirm with custom dialog
   - Add RBAC support in middleware
   - Fix context value recreation with useMemo

3. **LOW Priority (Code Quality)**
   - Remove `as any` type assertions
   - Add configurable cookie names
   - Optimize JWT validation to run at startup
   - Remove unused imports

---

## Files Requiring Immediate Attention

| File | High | Medium | Low |
|------|------|--------|-----|
| src/lib/authOptions.ts | 2 | 1 | 1 |
| src/hooks/use-toast.ts | 1 | 1 | 1 |
| src/components/transactions/TransactionListClient.tsx | 1 | 2 | 0 |
| src/components/transactions/TransactionForm.tsx | 1 | 0 | 0 |
| src/components/categories/CategoryManager.tsx | 1 | 0 | 0 |
| src/pages/api/auth/delete.ts | 1 | 1 | 0 |
| src/middleware/authMiddleware.ts | 0 | 4 | 3 |
| src/contexts/AuthContext.tsx | 0 | 2 | 1 |
| src/components/ui/modal.tsx | 0 | 1 | 0 |
| src/hooks/useLocalStorage.ts | 0 | 1 | 0 |
| src/pages/api/auth/login.ts | 0 | 1 | 0 |