import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// A3 spec (DESIGN.md §4):
//   Primary CTA: emerald background, charcoal text, pill (50px) radius,
//                emerald glow shadow, 600 weight.
//   Outline:     transparent w/ border, hover shifts to emerald text.
//   Ghost / link: text-only emerald hover state.
const buttonVariants = cva(
  // Adds a subtle press-scale via active:scale-[0.97] for snappy feedback.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-tight ring-offset-background transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // A3 emerald CTA - pill + glow.
        default:
          "rounded-pill bg-primary text-primary-foreground shadow-emerald hover:bg-primary/90 hover:shadow-emerald-hover active:shadow-emerald-active active:opacity-80",
        // Same shape as primary but warns/destroys.
        destructive:
          "rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-subtle",
        // Outline CTAs sit on white surfaces; hover paints emerald.
        outline:
          "rounded-pill border border-input bg-background text-foreground hover:border-primary hover:text-primary",
        secondary:
          "rounded-pill bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Tertiary / nav links - text only.
        ghost:
          "rounded-md text-foreground hover:text-primary hover:bg-primary/5",
        link:
          "text-primary underline-offset-4 hover:underline",
        // Approve / success buttons use the same emerald token.
        success:
          "rounded-pill bg-primary text-primary-foreground shadow-emerald hover:bg-primary/90 hover:shadow-emerald-hover active:shadow-emerald-active",
      },
      size: {
        // Primary CTA: 48px tall per DESIGN.md §4.
        default: "h-10 px-5 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 rounded-pill",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
