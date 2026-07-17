import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid min-h-20 w-full items-center gap-3 rounded-[2px] border-0 px-4 py-3 text-left text-base",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        info: "bg-indigo-100 text-indigo-800",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        destructive: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>

const alertIcons: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  default: InfoIcon,
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  destructive: OctagonXIcon,
}

function Alert({
  children,
  className,
  closeLabel = "Chiudi avviso",
  icon,
  onClose,
  variant = "default",
  ...props
}: Omit<React.ComponentProps<"div">, "onClose"> &
  Omit<VariantProps<typeof alertVariants>, "variant"> & {
    closeLabel?: string
    icon?: React.ReactNode | false
    onClose?: () => void
    variant?: AlertVariant
  }) {
  const Icon = alertIcons[variant]
  const hasIcon = icon !== false

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant }),
        hasIcon && onClose && "grid-cols-[auto_1fr_auto]",
        hasIcon && !onClose && "grid-cols-[auto_1fr]",
        !hasIcon && onClose && "grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    >
      {hasIcon &&
        (icon ?? (
          <Icon
            aria-hidden
            data-slot="alert-icon"
            className="size-5 shrink-0"
          />
        ))}
      <div className="min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="flex size-5 shrink-0 items-center justify-center rounded-[2px] text-current opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current/35"
        >
          <XIcon aria-hidden className="size-5" />
        </button>
      )}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "text-base leading-5 font-bold [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:opacity-80",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-base leading-5 font-normal text-current/80 text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:opacity-80 [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
