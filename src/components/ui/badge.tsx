import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent-600 text-white',
        success: 'border-green-500/25 bg-green-500/10 text-green-400',
        destructive: 'border-red-400/25 bg-red-400/10 text-[#f87171]',
        warning: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
        secondary: 'border-transparent bg-surface-elevated text-fg normal-case tracking-normal',
        outline: 'border-edge-emphasis text-fg-secondary normal-case tracking-normal',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- shadcn/ui pattern: variant helpers co-located with component
export { Badge, badgeVariants };
