import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const toastClassNames = {
    toast:
      "!rounded-none !border-[2px] !border-black !bg-[#FEFAE0] !text-black !shadow-[4px_4px_0px_0px_#1a1a1a] dark:!border-[#3f4c76] dark:!bg-[#1d2440] dark:!text-[#f8fafc] dark:!shadow-[4px_4px_0px_0px_#070b17]",
    title: "!text-[14px] !font-black !tracking-[0.01em]",
    description: "!mt-1 !text-[13px] !leading-relaxed !text-black/70 dark:!text-[#bfcae0]",
    content: "!gap-1.5",
    icon: "!text-current",
    closeButton:
      "!border-[2px] !border-black !rounded-none !bg-white !text-black !shadow-[2px_2px_0px_0px_#1a1a1a] hover:!-translate-x-px hover:!-translate-y-px hover:!shadow-[3px_3px_0px_0px_#1a1a1a] dark:!border-[#3f4c76] dark:!bg-[#243052] dark:!text-[#f8fafc] dark:!shadow-[2px_2px_0px_0px_#070b17] dark:hover:!shadow-[3px_3px_0px_0px_#070b17]",
    actionButton:
      "!rounded-none !border-[2px] !border-black !bg-[#4ECDC4] !text-black !font-black !shadow-[2px_2px_0px_0px_#1a1a1a] hover:!-translate-x-px hover:!-translate-y-px hover:!shadow-[3px_3px_0px_0px_#1a1a1a] dark:!border-[#3f4c76] dark:!bg-[#4ECDC4] dark:!text-[#09101f] dark:!shadow-[2px_2px_0px_0px_#070b17] dark:hover:!shadow-[3px_3px_0px_0px_#070b17]",
    cancelButton:
      "!rounded-none !border-[2px] !border-black !bg-white !text-black !font-black !shadow-[2px_2px_0px_0px_#1a1a1a] hover:!-translate-x-px hover:!-translate-y-px hover:!shadow-[3px_3px_0px_0px_#1a1a1a] dark:!border-[#3f4c76] dark:!bg-[#243052] dark:!text-[#f8fafc] dark:!shadow-[2px_2px_0px_0px_#070b17] dark:hover:!shadow-[3px_3px_0px_0px_#070b17]",
    success: "!bg-[#96CEB4] !text-[#09101f] !border-[#4d7e6a]",
    warning: "!bg-[#FFE66D] !text-[#332300] !border-[#b79c24]",
    error: "!bg-[#ffd7d7] !text-[#5d1717] !border-[#c76666] dark:!bg-[#5c2430] dark:!text-[#ffe9e9] dark:!border-[#b26d7a]",
    info: "!bg-[#d9f0ff] !text-[#12324f] !border-[#6d9cc0] dark:!bg-[#223c58] dark:!text-[#e6f4ff] dark:!border-[#688bb0]",
    loading: "!bg-[#e7eefc] !text-[#17263f] !border-[#7a8db0] dark:!bg-[#25324d] dark:!text-[#eef4ff] dark:!border-[#6c81a7]",
    default: "!bg-[#FEFAE0] !text-black !border-black dark:!bg-[#1d2440] dark:!text-[#f8fafc] dark:!border-[#3f4c76]",
  } as const

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      expand
      visibleToasts={4}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        ...props.toastOptions,
        classNames: {
          ...toastClassNames,
          ...props.toastOptions?.classNames,
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
