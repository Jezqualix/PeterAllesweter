import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-brand-600 text-white',
        secondary:   'border-transparent bg-brand-100 text-brand-800',
        available:   'border-transparent bg-brand-100 text-brand-800',
        unavailable: 'border-transparent bg-red-100 text-red-800',
        reserved:    'border-transparent bg-orange-100 text-orange-800',
        maintenance: 'border-transparent bg-accent-light text-brand-900',
        outline:     'border-[#d6d6d6] text-[#494949]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
