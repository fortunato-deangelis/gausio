import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AuthHistoryGuard } from "./auth-history-guard";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import type { ShellContext } from "./types";

/** Composizione della shell (sidebar + topbar + contenuto). */
export function AppShell({
  ctx,
  children,
}: Readonly<{ ctx: ShellContext; children: ReactNode }>) {
  return (
    <SidebarProvider>
      <AuthHistoryGuard />
      <AppSidebar ctx={ctx} />
      <SidebarInset>
        <AppTopbar ctx={ctx} />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
