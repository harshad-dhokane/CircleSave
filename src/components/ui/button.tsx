import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[15px] font-bold transition-all disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[4px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border-[2px] border-black bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[4px_4px_0px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1a1a] dark:border-[#3f4c76] dark:shadow-[2px_2px_0px_0px_#070b17] dark:hover:shadow-[4px_4px_0px_0px_#070b17] dark:active:shadow-[1px_1px_0px_0px_#070b17]",
        destructive:
          "border-[2px] border-black bg-destructive text-white shadow-[2px_2px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[4px_4px_0px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1a1a] focus-visible:ring-destructive/20 dark:border-[#84465a] dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 dark:shadow-[2px_2px_0px_0px_#070b17] dark:hover:shadow-[4px_4px_0px_0px_#070b17] dark:active:shadow-[1px_1px_0px_0px_#070b17]",
        outline:
          "border-[2px] border-black bg-background shadow-[2px_2px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-[4px_4px_0px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1a1a] dark:bg-input/30 dark:border-[#3f4c76] dark:hover:bg-input/50 dark:shadow-[2px_2px_0px_0px_#070b17] dark:hover:shadow-[4px_4px_0px_0px_#070b17] dark:active:shadow-[1px_1px_0px_0px_#070b17]",
        secondary:
          "border-[2px] border-black bg-secondary text-secondary-foreground shadow-[2px_2px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-secondary/80 hover:shadow-[4px_4px_0px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1a1a] dark:border-[#3f4c76] dark:shadow-[2px_2px_0px_0px_#070b17] dark:hover:shadow-[4px_4px_0px_0px_#070b17] dark:active:shadow-[1px_1px_0px_0px_#070b17]",
        ghost:
          "border-[2px] border-transparent bg-transparent hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-black hover:bg-accent hover:text-accent-foreground hover:shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1a1a] dark:hover:border-[#3f4c76] dark:hover:bg-accent/50 dark:hover:shadow-[3px_3px_0px_0px_#070b17] dark:active:shadow-[1px_1px_0px_0px_#070b17]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-md gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-md px-7 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
