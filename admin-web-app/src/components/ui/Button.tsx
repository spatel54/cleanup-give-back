/** Ported verbatim from `admin/components/ui/Button.tsx` (no external deps beyond React/Tailwind). */
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const VARIANT_CLASSES = {
  primary: "bg-primary text-white border-primary hover:bg-primary-hover",
  secondary: "bg-bg-surface text-text-primary border-border-outline hover:bg-bg-surface-elevated",
  tertiary: "bg-transparent text-text-tertiary border-transparent hover:bg-bg-surface-elevated",
  danger:
    "bg-status-declined-bg text-status-declined-text border-status-declined-border hover:bg-status-declined-hover",
  ghost: "bg-transparent text-text-primary border-transparent hover:bg-bg-surface-elevated",
};

const SIZE_CLASSES = {
  sm: "h-9 px-md text-sm",
  md: "h-11 px-lg text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-sm rounded-sm border min-h-11 min-w-11
          font-data font-semibold transition-all duration-[160ms]
          active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
          ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
