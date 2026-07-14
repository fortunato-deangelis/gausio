"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app/impostazioni", label: "Profilo azienda" },
  { href: "/app/impostazioni/membri", label: "Membri" },
  { href: "/app/impostazioni/ruoli", label: "Ruoli e permessi" },
] as const;

/** Tab di navigazione delle impostazioni workspace. */
export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sezioni impostazioni"
      className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
