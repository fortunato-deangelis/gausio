"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NAV_GROUPS } from "@/lib/navigation";
import { signOutAction } from "./actions";
import type { ShellContext } from "./types";
import { Fragment } from "react";

/** Mappa href → titolo dalla navigazione, per i breadcrumb. */
const TITLE_BY_HREF = new Map<string, string>(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.href, i.title] as const))
);

const SEGMENT_LABELS: Record<string, string> = {
  vendite: "Vendite",
  acquisti: "Acquisti",
  logistica: "Logistica",
  nuovo: "Nuovo",
  nuova: "Nuova",
  movimenti: "Movimenti",
  assenze: "Assenze",
  timbrature: "Timbrature",
  "schede-lavoro": "Schede lavoro",
  membri: "Membri",
  ruoli: "Ruoli e permessi",
};

function crumbLabel(href: string, segment: string): string {
  const fromNav = TITLE_BY_HREF.get(href);
  if (fromNav) return fromNav;
  const fromMap = SEGMENT_LABELS[segment];
  if (fromMap) return fromMap;
  if (/^[0-9a-f-]{36}$/i.test(segment)) return "Dettaglio";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

/** Topbar flottante stile Vuexy: trigger sidebar, breadcrumb, ricerca, azioni. */
export function AppTopbar({ ctx }: Readonly<{ ctx: ShellContext }>) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // Breadcrumb: /app è "Dashboard", i segmenti successivi si accumulano.
  const crumbs = segments.slice(1).map((segment, index) => {
    const href = `/app/${segments.slice(1, index + 2).join("/")}`;
    return { href, label: crumbLabel(href, segment) };
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger aria-label="Apri/chiudi menu" />
      <Separator orientation="vertical" className="h-5" />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            {crumbs.length === 0 ? (
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href="/app">Dashboard</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === crumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative hidden sm:block">
          <Search
            aria-hidden
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Cerca…"
            aria-label="Cerca nell'applicazione"
            className="w-48 pl-8 lg:w-64"
          />
        </div>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifiche">
              <Bell className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Nessuna nuova notifica</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Menu utente"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials(ctx.userName, ctx.userEmail)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate">{ctx.userName ?? "Utente"}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {ctx.userEmail}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/impostazioni">
                <Settings aria-hidden className="size-4" />
                Impostazioni
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => void signOutAction()}
            >
              <LogOut aria-hidden className="size-4" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
