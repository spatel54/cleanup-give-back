import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES = {
  primary: 'bg-primary text-white border-primary hover:bg-[#00612c]',
  secondary: 'bg-bg-surface text-text-primary border-border-outline hover:bg-bg-surface-elevated',
  danger: 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a] hover:bg-[#ffbfc6]',
  ghost: 'bg-transparent text-text-primary border-transparent hover:bg-bg-surface-elevated',
};

const SIZE_CLASSES = {
  sm: 'h-9 px-md text-sm',
  md: 'h-11 px-lg text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          interactive inline-flex items-center justify-center gap-sm rounded-sm border
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

Button.displayName = 'Button';
