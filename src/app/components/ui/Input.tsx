import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl bg-input-background border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
