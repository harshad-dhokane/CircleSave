import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold tracking-[-0.01em] transition-all duration-200 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "border border-[#9ad255]/35 bg-[linear-gradient(135deg,#B5F36B_0%,#D9FF8C_100%)] text-slate-950 shadow-[0_18px_42px_-24px_rgba(120,170,43,0.52)] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#C2F97A_0%,#E1FF98_100%)] hover:shadow-[0_22px_52px_-26px_rgba(120,170,43,0.58)] dark:border-[#9ad255]/28 dark:bg-[linear-gradient(135deg,#B5F36B_0%,#7CC8FF_100%)] dark:text-slate-950 dark:shadow-[0_22px_52px_-28px_rgba(78,110,24,0.56)] dark:hover:bg-[linear-gradient(135deg,#C8FA7E_0%,#8DD2FF_100%)] dark:hover:shadow-[0_24px_56px_-28px_rgba(66,103,140,0.68)]",
        destructive:
          "border border-rose-500/20 bg-destructive text-white shadow-[0_18px_42px_-24px_rgba(220,38,38,0.55)] hover:-translate-y-0.5 hover:bg-destructive/92 hover:shadow-[0_22px_52px_-26px_rgba(220,38,38,0.62)] focus-visible:ring-destructive/25",
        outline:
          "border border-black/10 bg-black/[0.03] text-foreground shadow-[0_16px_40px_-26px_rgba(15,23,42,0.24)] backdrop-blur-xl hover:-translate-y-0.5 hover:border-[#B5F36B]/22 hover:bg-black/[0.05] hover:shadow-[0_20px_48px_-28px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#B5F36B]/18 dark:hover:bg-white/8 dark:shadow-[0_20px_46px_-28px_rgba(0,0,0,0.82)] dark:hover:shadow-[0_22px_50px_-30px_rgba(30,58,92,0.48)]",
        secondary:
          "border border-black/10 bg-black/[0.03] text-foreground shadow-[0_16px_38px_-26px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-[#B5F36B]/22 hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#B5F36B]/18 dark:hover:bg-white/8 dark:shadow-[0_20px_46px_-28px_rgba(0,0,0,0.78)]",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:-translate-y-0.5 hover:bg-black/[0.04] dark:hover:bg-white/6",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-5 text-[14px] has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-xl",
        "icon-lg": "size-10 rounded-xl",
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
