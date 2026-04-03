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
      "!rounded-[24px] !border !border-black/10 !bg-white/92 !text-black !shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)] !backdrop-blur-2xl dark:!border-white/10 dark:!bg-[#0d111a]/92 dark:!text-[#f8fafc] dark:!shadow-[0_28px_70px_-36px_rgba(0,0,0,0.92)]",
    title: "!font-display !text-[14px] !font-semibold !tracking-[-0.02em]",
    description: "!mt-1 !text-[13px] !leading-relaxed !text-black/70 dark:!text-[#bfcae0]",
    content: "!gap-1.5",
    icon: "!text-current",
    closeButton:
      "!rounded-2xl !border !border-black/10 !bg-white/82 !text-black !shadow-[0_16px_36px_-24px_rgba(15,23,42,0.34)] hover:!bg-white dark:!border-white/10 dark:!bg-white/8 dark:!text-[#f8fafc] dark:!shadow-[0_20px_42px_-26px_rgba(0,0,0,0.86)] dark:hover:!bg-white/12",
    actionButton:
      "!rounded-2xl !border !border-black/10 !bg-foreground !text-white !font-semibold !shadow-[0_18px_42px_-24px_rgba(15,23,42,0.54)] dark:!border-white/10 dark:!bg-white dark:!text-[#09101f] dark:!shadow-[0_20px_46px_-26px_rgba(0,0,0,0.9)]",
    cancelButton:
      "!rounded-2xl !border !border-black/10 !bg-white/82 !text-black !font-semibold !shadow-[0_16px_36px_-24px_rgba(15,23,42,0.34)] dark:!border-white/10 dark:!bg-white/8 dark:!text-[#f8fafc] dark:!shadow-[0_20px_42px_-26px_rgba(0,0,0,0.86)]",
    success: "!bg-[#b9f480]/96 !text-[#101809] !border-[#9ad65a]",
    warning: "!bg-[#ffd789]/96 !text-[#30210a] !border-[#d7ad52]",
    error: "!bg-[#ffd6d3]/96 !text-[#5d1717] !border-[#ec9f98] dark:!bg-[#4b2028]/96 dark:!text-[#ffe9e9] dark:!border-[#87505d]",
    info: "!bg-[#d7ecff]/96 !text-[#102c46] !border-[#9bc7e9] dark:!bg-[#1e3043]/96 dark:!text-[#e6f4ff] dark:!border-[#4b6f93]",
    loading: "!bg-[#e7eefc]/96 !text-[#17263f] !border-[#b8c7e1] dark:!bg-[#25324d]/96 dark:!text-[#eef4ff] dark:!border-[#51688a]",
    default: "!bg-white/92 !text-black !border-black/10 dark:!bg-[#0d111a]/92 dark:!text-[#f8fafc] dark:!border-white/10",
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
