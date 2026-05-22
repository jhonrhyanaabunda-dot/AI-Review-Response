import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// A3 badges — small caps, tight letter spacing, sharp 4px corners
// (DESIGN.md §4 "Dealership Badge" + "Status Badge").
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        success: "border-primary bg-primary/10 text-primary",
        warning: "border-warning/40 bg-warning/15 text-warning",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
