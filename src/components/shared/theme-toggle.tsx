"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/** Toggle tema chiaro/scuro per topbar e pagine pubbliche. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambia tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun aria-hidden className="size-5 dark:hidden" />
      <Moon aria-hidden className="hidden size-5 dark:block" />
    </Button>
  );
}
