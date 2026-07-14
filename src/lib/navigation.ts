import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Briefcase,
  Contact,
  FileInput,
  FileOutput,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import type { AppModule } from "@/server/auth/permissions";

/**
 * Mappa di navigazione della dashboard (menu verticale stile Vuexy).
 * Ogni voce dichiara il modulo di permesso richiesto: la sidebar mostra
 * solo le voci per cui il ruolo ha `view`.
 */

export type NavItem = Readonly<{
  title: string;
  href: string;
  icon: LucideIcon;
  module: AppModule | null; // null = visibile a tutti i membri
}>;

export type NavGroup = Readonly<{
  label: string | null;
  items: readonly NavItem[];
}>;

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: null,
    items: [
      { title: "Dashboard", href: "/app", icon: LayoutDashboard, module: null },
    ],
  },
  {
    label: "Anagrafiche",
    items: [
      {
        title: "Clienti e fornitori",
        href: "/app/contatti",
        icon: Contact,
        module: "contacts",
      },
    ],
  },
  {
    label: "Vendite",
    items: [
      {
        title: "Ordini emessi",
        href: "/app/vendite/ordini",
        icon: ShoppingCart,
        module: "orders_issued",
      },
      {
        title: "Fatture emesse",
        href: "/app/vendite/fatture",
        icon: FileOutput,
        module: "invoices_issued",
      },
    ],
  },
  {
    label: "Acquisti",
    items: [
      {
        title: "Ordini ricevuti",
        href: "/app/acquisti/ordini",
        icon: Receipt,
        module: "orders_received",
      },
      {
        title: "Fatture ricevute",
        href: "/app/acquisti/fatture",
        icon: FileInput,
        module: "invoices_received",
      },
    ],
  },
  {
    label: "Logistica",
    items: [
      { title: "DDT", href: "/app/logistica/ddt", icon: Truck, module: "ddt" },
      {
        title: "Magazzino",
        href: "/app/magazzino",
        icon: Boxes,
        module: "warehouse",
      },
    ],
  },
  {
    label: "Lavoro",
    items: [
      {
        title: "Commesse",
        href: "/app/commesse",
        icon: Briefcase,
        module: "jobs",
      },
      {
        title: "Progetti",
        href: "/app/progetti",
        icon: KanbanSquare,
        module: "projects",
      },
      { title: "Personale", href: "/app/personale", icon: Users, module: "hr" },
    ],
  },
  {
    label: "Qualità",
    items: [
      {
        title: "Documenti ISO",
        href: "/app/iso",
        icon: ShieldCheck,
        module: "iso",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Impostazioni",
        href: "/app/impostazioni",
        icon: Settings,
        module: "settings",
      },
    ],
  },
] as const;

/** Voce documentale generica usata nei breadcrumb. */
export const APP_HOME = { title: "Dashboard", href: "/app", icon: FileText };
