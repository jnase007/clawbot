import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-destructive/10 text-destructive': variant === 'destructive',
          'border border-border text-muted-foreground': variant === 'outline',
          'bg-green-500/10 text-green-500': variant === 'success',
          'bg-amber-500/10 text-amber-500': variant === 'warning',
          'bg-blue-500/10 text-blue-500': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
