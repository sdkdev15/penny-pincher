import { z } from "zod";

// Transaction validation schemas
export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Transaction type is required.",
    invalid_type_error: "Transaction type must be 'income' or 'expense'.",
  }),
  amount: z
    .number({ required_error: "Amount is required." })
    .positive({ message: "Amount must be greater than zero." })
    .max(1e12, { message: "Amount is too large." }),
  categoryId: z
    .number({ required_error: "Category ID is required." })
    .int({ message: "Category ID must be an integer." })
    .positive({ message: "Category ID must be positive." }),
  date: z
    .string({ required_error: "Date is required." })
    .refine(
      (date) => !isNaN(Date.parse(date)),
      { message: "Date must be a valid ISO date string." }
    ),
  notes: z.string().max(500, { message: "Notes must not exceed 500 characters." }).optional().nullable(),
});

export const updateTransactionSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  amount: z
    .number()
    .positive({ message: "Amount must be greater than zero." })
    .max(1e12, { message: "Amount is too large." })
    .optional(),
  categoryId: z
    .number()
    .int()
    .positive()
    .optional(),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Date must be a valid ISO date string.",
    })
    .optional(),
  notes: z.string().max(500).optional().nullable(),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required." })
    .min(1, { message: "Category name cannot be empty." })
    .max(100, { message: "Category name must not exceed 100 characters." })
    .trim(),
  budget: z
    .number()
    .positive({ message: "Budget must be greater than zero." })
    .max(1e12, { message: "Budget is too large." })
    .optional()
    .nullable(),
  isDefault: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Category name cannot be empty." })
    .max(100, { message: "Category name must not exceed 100 characters." })
    .trim()
    .optional(),
  budget: z
    .number()
    .positive()
    .max(1e12)
    .optional()
    .nullable(),
  isDefault: z.boolean().optional(),
});

// User/Authentication validation schemas
export const registerSchema = z.object({
  username: z
    .string({ required_error: "Username is required." })
    .min(3, { message: "Username must be at least 3 characters." })
    .max(50, { message: "Username must not exceed 50 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  password: z
    .string({ required_error: "Password is required." })
    .min(6, { message: "Password must be at least 6 characters." })
    .max(100, { message: "Password must not exceed 100 characters." }),
  isAdmin: z.boolean().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const updatePasswordSchema = z.object({
  password: z
    .string({ required_error: "Password is required." })
    .min(6, { message: "Password must be at least 6 characters." })
    .max(100, { message: "Password must not exceed 100 characters." }),
  userId: z.number().int().positive().optional(),
});

// Helper function to parse request body
export function parseRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const error = result.error.errors[0];
    return {
      success: false,
      error: error?.message || "Invalid input.",
    };
  }

  return { success: true, data: result.data };
}

// Type exports
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;