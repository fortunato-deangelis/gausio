"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AppDialogProps = Readonly<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger opzionale: in alternativa controllare con open/onOpenChange. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}>;

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

/** Wrapper standard del Dialog shadcn con header/footer preimpostati. */
export function AppDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  size = "md",
  className,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(sizeClasses[size], "max-h-[90dvh] overflow-y-auto", className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
