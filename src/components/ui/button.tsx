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
          "border border-[#9ad255]/35 bg-[#B5F36B] text-slate-950 shadow-[0_18px_42px_-24px_rgba(120,170,43,0.52)] hover:-translate-y-0.5 hover:bg-[#c4f77b] hover:shadow-[0_22px_52px_-26px_rgba(120,170,43,0.58)] dark:border-[#9ad255]/28 dark:bg-[#B5F36B] dark:text-slate-950 dark:shadow-[0_0_24px_-8px_rgba(181,243,107,0.3),0_22px_52px_-28px_rgba(78,110,24,0.56)] dark:hover:bg-[#c4f77b] dark:hover:shadow-[0_0_32px_-8px_rgba(181,243,107,0.4),0_24px_56px_-28px_rgba(66,103,140,0.68)]",
        sky:
          "border border-[#66b8ef]/35 bg-[#7CC8FF] text-slate-950 shadow-[0_18px_42px_-24px_rgba(74,144,226,0.42)] hover:-translate-y-0.5 hover:bg-[#91d2ff] hover:shadow-[0_22px_52px_-26px_rgba(74,144,226,0.5)] dark:border-[#66b8ef]/28 dark:bg-[#7CC8FF] dark:text-slate-950 dark:shadow-[0_0_24px_-8px_rgba(124,200,255,0.28),0_22px_52px_-28px_rgba(37,74,122,0.5)] dark:hover:bg-[#91d2ff] dark:hover:shadow-[0_0_30px_-8px_rgba(124,200,255,0.36),0_24px_56px_-28px_rgba(37,74,122,0.58)]",
        amber:
          "border border-[#e09938]/30 bg-[#FFB457] text-slate-950 shadow-[0_18px_42px_-24px_rgba(223,147,35,0.42)] hover:-translate-y-0.5 hover:bg-[#ffc06f] hover:shadow-[0_22px_52px_-26px_rgba(223,147,35,0.5)] dark:border-[#e09938]/28 dark:bg-[#FFB457] dark:text-slate-950 dark:shadow-[0_0_24px_-8px_rgba(255,180,87,0.28),0_22px_52px_-28px_rgba(122,77,21,0.5)] dark:hover:bg-[#ffc06f] dark:hover:shadow-[0_0_30px_-8px_rgba(255,180,87,0.35),0_24px_56px_-28px_rgba(122,77,21,0.58)]",
        violet:
          "border border-[#8a6fe0]/30 bg-[#A48DFF] text-slate-950 shadow-[0_18px_42px_-24px_rgba(124,94,255,0.4)] hover:-translate-y-0.5 hover:bg-[#b39fff] hover:shadow-[0_22px_52px_-26px_rgba(124,94,255,0.48)] dark:border-[#8a6fe0]/28 dark:bg-[#A48DFF] dark:text-slate-950 dark:shadow-[0_0_24px_-8px_rgba(164,141,255,0.3),0_22px_52px_-28px_rgba(76,59,134,0.5)] dark:hover:bg-[#b39fff] dark:hover:shadow-[0_0_30px_-8px_rgba(164,141,255,0.36),0_24px_56px_-28px_rgba(76,59,134,0.58)]",
        mint:
          "border border-[#5cc5a1]/30 bg-[#7AE7C7] text-slate-950 shadow-[0_18px_42px_-24px_rgba(43,173,133,0.38)] hover:-translate-y-0.5 hover:bg-[#8eeed2] hover:shadow-[0_22px_52px_-26px_rgba(43,173,133,0.46)] dark:border-[#5cc5a1]/28 dark:bg-[#7AE7C7] dark:text-slate-950 dark:shadow-[0_0_24px_-8px_rgba(122,231,199,0.28),0_22px_52px_-28px_rgba(35,101,81,0.5)] dark:hover:bg-[#8eeed2] dark:hover:shadow-[0_0_30px_-8px_rgba(122,231,199,0.35),0_24px_56px_-28px_rgba(35,101,81,0.58)]",
        destructive:
          "border border-rose-500/20 bg-destructive text-white shadow-[0_18px_42px_-24px_rgba(220,38,38,0.55)] hover:-translate-y-0.5 hover:bg-destructive/92 hover:shadow-[0_22px_52px_-26px_rgba(220,38,38,0.62)] focus-visible:ring-destructive/25",
        outline:
          "border border-black/10 bg-[#f4eee5] text-foreground shadow-[0_16px_40px_-26px_rgba(15,23,42,0.24)] hover:-translate-y-0.5 hover:border-[#B5F36B]/26 hover:bg-[#ece6db] hover:shadow-[0_20px_48px_-28px_rgba(15,23,42,0.3)] dark:border-white/8 dark:bg-[#161618] dark:text-white dark:hover:border-[#B5F36B]/22 dark:hover:bg-[#1e1e20] dark:shadow-[0_20px_46px_-28px_rgba(0,0,0,0.82)] dark:hover:shadow-[0_22px_50px_-30px_rgba(30,58,92,0.48)]",
        secondary:
          "border border-black/10 bg-[#efe9df] text-foreground shadow-[0_16px_38px_-26px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-[#B5F36B]/28 hover:bg-[#e8e1d7] dark:border-white/8 dark:bg-[#161618] dark:text-white dark:hover:border-[#B5F36B]/22 dark:hover:bg-[#1e1e20] dark:shadow-[0_20px_46px_-28px_rgba(0,0,0,0.78)]",
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
