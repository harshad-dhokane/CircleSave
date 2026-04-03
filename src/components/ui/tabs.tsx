"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "text-muted-foreground inline-flex h-auto w-fit items-center justify-center gap-1 rounded-[18px] border border-black/8 bg-white/72 p-1 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_22px_50px_-30px_rgba(0,0,0,0.84)]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/40 text-foreground dark:text-muted-foreground inline-flex min-h-[2.35rem] flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-transparent px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 hover:bg-black/[0.04] dark:hover:bg-white/8 data-[state=active]:border-[#9ad255]/35 data-[state=active]:bg-[#B5F36B] data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_18px_42px_-26px_rgba(120,170,43,0.42)] dark:data-[state=active]:border-[#9ad255]/28 dark:data-[state=active]:bg-[#B5F36B] dark:data-[state=active]:text-slate-950 dark:data-[state=active]:shadow-[0_20px_46px_-26px_rgba(78,110,24,0.6)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
