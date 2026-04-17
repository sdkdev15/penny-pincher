/**
 * Environment Variables Validation
 * 
 * This module validates that all required environment variables are present
 * and properly configured when the application starts.
 */

interface EnvError {
  variable: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: EnvError[];
}

// Define required environment variables
const REQUIRED_ENV_VARS = [
  { name: "DATABASE_URL", description: "PostgreSQL database connection string" },
  { name: "JWT_SECRET", description: "Secret key for JWT token signing" },
] as const;

// Define optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  JWT_EXPIRES_IN: "1d",
  NODE_ENV: "development",
} as const;

type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number]["name"];
type OptionalEnvVar = keyof typeof OPTIONAL_ENV_VARS;

// Validate required environment variables
export function validateRequiredEnvVars(): ValidationResult {
  const errors: EnvError[] = [];

  for (const { name, description } of REQUIRED_ENV_VARS) {
    const value = process.env[name];
    
    if (!value || value.trim() === "") {
      errors.push({
        variable: name,
        message: `Missing or empty. ${description}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get environment variable with type safety
export function getRequiredEnvVar(name: RequiredEnvVar): string {
  const value = process.env[name];
  
  if (!value || value.trim() === "") {
    throw new Error(
      `Environment variable '${name}' is required but not set. ` +
      `Please check your .env file and ensure all required variables are configured.`
    );
  }
  
  return value;
}

export function getOptionalEnvVar<T extends string>(
  name: OptionalEnvVar,
  defaultValue: T
): T {
  return (process.env[name] as T) || defaultValue;
}

// Validate and log environment configuration
export function validateEnv(): void {
  const result = validateRequiredEnvVars();

  if (!result.isValid) {
    console.error("\n❌ Environment Validation Failed:");
    console.error("==============================\n");
    
    for (const error of result.errors) {
      console.error(`  ✗ ${error.variable}`);
      console.error(`    ${error.message}\n`);
    }

    console.error("\nPlease fix the above issues and restart the application.\n");
    
    // In production, throw an error to prevent the app from starting
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Environment validation failed with ${result.errors.length} error(s). ` +
        "See above for details."
      );
    }

    // In development, just warn but allow the app to continue
    console.warn("⚠️  Continuing in development mode with missing environment variables.\n");
  } else {
    console.log("✓ Environment variables validated successfully.");
  }
}

// Initialize environment validation
export function initEnv(): void {
  validateEnv();
}

// Type-safe environment variable accessors
export const env = {
  get DATABASE_URL(): string {
    return getRequiredEnvVar("DATABASE_URL");
  },
  get JWT_SECRET(): string {
    return getRequiredEnvVar("JWT_SECRET");
  },
  get JWT_EXPIRES_IN(): string {
    return getOptionalEnvVar("JWT_EXPIRES_IN", "1d");
  },
  get NODE_ENV(): string {
    return getOptionalEnvVar("NODE_ENV", "development");
  },
  get isDevelopment(): boolean {
    return this.NODE_ENV === "development";
  },
  get isProduction(): boolean {
    return this.NODE_ENV === "production";
  },
  get isTest(): boolean {
    return this.NODE_ENV === "test";
  },
} as const;