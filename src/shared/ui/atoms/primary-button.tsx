import { forwardRef } from "react"
import { Button, ButtonProps } from "@shared/ui/atoms/button"
import { cn } from "@shared/lib/utils"

interface PrimaryButtonProps extends ButtonProps { }

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
    ({ className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                size="xl"
                className={cn("w-full shadow-primary/30 hover:shadow-primary/40", className)}
                {...props}
            />
        )
    }
)

PrimaryButton.displayName = "PrimaryButton"
