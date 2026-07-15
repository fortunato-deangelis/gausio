"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: (
          <CircleCheckIcon className="size-5" />
        ),
        info: (
          <InfoIcon className="size-5" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5" />
        ),
        error: (
          <OctagonXIcon className="size-5" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin" />
        ),
        close: <XIcon className="size-5" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "2px",
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: "Chiudi notifica",
        classNames: {
          toast:
            "cn-toast !min-h-20 !items-center !gap-3 !rounded-[2px] !border-0 !px-4 !py-3 data-[type=normal]:!bg-muted data-[type=normal]:!text-foreground data-[type=info]:!bg-indigo-100 data-[type=info]:!text-indigo-800 data-[type=success]:!bg-emerald-100 data-[type=success]:!text-emerald-800 data-[type=warning]:!bg-amber-100 data-[type=warning]:!text-amber-800 data-[type=error]:!bg-red-100 data-[type=error]:!text-red-800",
          icon: "!order-1 !m-0 !size-5 [&_svg]:!size-5",
          content: "!order-2 !min-w-0 !flex-1 !gap-1",
          title: "!text-base !font-bold !leading-5",
          description: "!text-base !font-normal !leading-5 !opacity-80",
          closeButton:
            "!static !order-3 !m-0 !size-5 !shrink-0 !transform-none !rounded-[2px] !border-0 !bg-transparent !p-0 !text-current !opacity-70 hover:!opacity-100 [&_svg]:!size-5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
