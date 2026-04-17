import { useEffect, useRef, useCallback } from "react";

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle focus trapping and backdrop click
  useEffect(() => {
    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Restore focus when modal closes
    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, []);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="bg-card text-card-foreground p-6 rounded-lg shadow-lg w-full max-w-md"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <button
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}