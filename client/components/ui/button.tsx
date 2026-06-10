import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Lyra: bg=lyra/color/bg/primary (#166CCA), fg=white, h=36px, px=16px, radius=8px
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        // Lyra: bg=#BD2A2A, fg=white
        destructive:
          "bg-[#BD2A2A] text-white hover:bg-[#A82626] active:bg-[#941f1f] dark:bg-[#C93333] dark:hover:bg-[#B82A2A]",
        // Lyra: bg=white, border=rgba(0,0,0,0.16), fg=#5D6A79
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Lyra: bg=white, border=rgba(0,0,0,0.16), fg=lyra/color/fg/action (#5D6A79)
        secondary:
          "bg-white dark:bg-card border border-black/[0.16] dark:border-white/[0.14] text-[#5D6A79] dark:text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.08] dark:active:bg-white/[0.1]",
        // Lyra: bg=transparent, px=8px, font-weight=400 (Regular), fg=#5D6A79
        ghost:
          "font-normal text-[#5D6A79] dark:text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.1] dark:active:bg-white/[0.12]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Lyra default height: 36px, px: 16px
        default: "h-9 px-4 py-2 min-w-[80px]",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        // Ghost uses less horizontal padding (lyra/spacing/2 = 8px)
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
