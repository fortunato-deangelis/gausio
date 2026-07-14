"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppDropdownItem =
  | Readonly<{
      type?: "item";
      label: string;
      icon?: LucideIcon;
      onSelect?: () => void;
      href?: string;
      destructive?: boolean;
      disabled?: boolean;
    }>
  | Readonly<{ type: "separator" }>
  | Readonly<{ type: "label"; label: string }>;

type AppDropdownProps = Readonly<{
  trigger: ReactNode;
  items: readonly AppDropdownItem[];
  align?: "start" | "center" | "end";
}>;

/** Menu a tendina config-driven: le feature descrivono le voci, non il markup. */
export function AppDropdown({ trigger, items, align = "end" }: AppDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item, index) => {
          if (item.type === "separator") {
            return <DropdownMenuSeparator key={index} />;
          }
          if (item.type === "label") {
            return (
              <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>
            );
          }
          const Icon = item.icon;
          const content = (
            <>
              {Icon && <Icon aria-hidden className="size-4" />}
              {item.label}
            </>
          );
          return (
            <DropdownMenuItem
              key={index}
              variant={item.destructive ? "destructive" : "default"}
              disabled={item.disabled}
              onSelect={item.onSelect}
              asChild={Boolean(item.href)}
            >
              {item.href ? <a href={item.href}>{content}</a> : content}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
