export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-4",
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-primary border-gray-300 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}