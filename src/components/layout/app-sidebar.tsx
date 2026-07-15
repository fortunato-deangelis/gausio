"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2, Check, ChevronsUpDown, Plus, Zap } from "lucide-react";
import { toast } from "@/components/shared/toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_GROUPS } from "@/lib/navigation";
import { switchWorkspace } from "@/features/workspaces/actions";
import { cn } from "@/lib/utils";
import type { ShellContext } from "./types";

/**
 * Sidebar verticale stile Vuexy: gruppi etichettati, voce attiva a pillola
 * con gradiente primario, switcher workspace nell'header.
 */
export function AppSidebar({ ctx }: Readonly<{ ctx: ShellContext }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const isActive = (href: string) =>
    href === "/app"
      ? pathname === "/app"
      : pathname === href || pathname.startsWith(`${href}/`);

  const onSwitch = (workspaceId: string) => {
    if (workspaceId === ctx.workspaceId) return;
    startTransition(async () => {
      const result = await switchWorkspace(workspaceId);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  aria-label="Cambia workspace"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                    <Zap aria-hidden className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {ctx.workspaceName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {ctx.roleName}
                    </span>
                  </span>
                  <ChevronsUpDown
                    aria-hidden
                    className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>I tuoi workspace</DropdownMenuLabel>
                {ctx.memberships.map((m) => (
                  <DropdownMenuItem
                    key={m.workspaceId}
                    onSelect={() => onSwitch(m.workspaceId)}
                  >
                    <Building2 aria-hidden className="size-4" />
                    <span className="truncate">{m.workspaceName}</span>
                    {m.workspaceId === ctx.workspaceId && (
                      <Check aria-hidden className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/onboarding">
                    <Plus aria-hidden className="size-4" />
                    Crea nuovo workspace
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (item) =>
              item.module === null || ctx.permissions[item.module]?.view
          );
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label ?? "main"}>
              {group.label && (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                        className={cn(
                          "data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary data-[active=true]:to-primary/80",
                          "data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Gausio © {new Date().getFullYear()}
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
