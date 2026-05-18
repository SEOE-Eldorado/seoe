import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority' // Added cva import

import { cn } from '@shared/lib/utils'

const inputVariants = cva(
  "flex w-full min-w-0 rounded-md border bg-transparent text-base transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input shadow-xs file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30",
        pill: "border-none bg-muted rounded-full font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50",
        ghost: "border-none shadow-none bg-transparent focus-visible:ring-0",
      },
      size: {
        default: "h-9 px-3 py-1 file:h-7",
        sm: "h-8 px-2 text-xs",
        lg: "h-10 px-4",
        xl: "h-14 px-6 text-lg",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  VariantProps<typeof inputVariants> { } // Added VariantProps

function Input({ className, type, variant, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
