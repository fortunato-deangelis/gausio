import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import type { ShellContext } from "@/components/layout/types";
import { requireWorkspace } from "@/server/workspace";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
    },
  },
};

/** Shell della dashboard: sidebar + topbar, protetta da requireWorkspace. */
export default async function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const ctx = await requireWorkspace();

  const shellCtx: ShellContext = {
    userName: ctx.userName,
    userEmail: ctx.userEmail,
    workspaceId: ctx.workspace.id,
    workspaceName: ctx.workspace.name,
    roleKey: ctx.role.key,
    roleName: ctx.role.name,
    permissions: ctx.permissions,
    memberships: ctx.memberships,
  };

  return <AppShell ctx={shellCtx}>{children}</AppShell>;
}
