import type { moduleEnum, roleKeyEnum } from "@/server/db/schema";

/**
 * Modello dei permessi: ogni ruolo ha, per ciascun modulo, i flag
 * view/create/edit/delete. Il ruolo admin è di sistema e ha sempre tutto.
 */

export type AppModule = (typeof moduleEnum.enumValues)[number];
export type RoleKey = (typeof roleKeyEnum.enumValues)[number];
export type PermissionAction = "view" | "create" | "edit" | "delete";

export type ModulePermissions = Readonly<{
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}>;

export type PermissionMap = Readonly<Record<AppModule, ModulePermissions>>;

export const MODULES: readonly { value: AppModule; label: string }[] = [
  { value: "contacts", label: "Clienti e fornitori" },
  { value: "orders_issued", label: "Ordini emessi" },
  { value: "orders_received", label: "Ordini ricevuti" },
  { value: "invoices_issued", label: "Fatture emesse" },
  { value: "invoices_received", label: "Fatture ricevute" },
  { value: "ddt", label: "DDT" },
  { value: "warehouse", label: "Magazzino" },
  { value: "jobs", label: "Commesse" },
  { value: "projects", label: "Project management" },
  { value: "hr", label: "Personale" },
  { value: "iso", label: "Documenti ISO" },
  { value: "settings", label: "Impostazioni workspace" },
] as const;

export const MODULE_VALUES = MODULES.map((m) => m.value);

export function moduleLabel(module: AppModule): string {
  return MODULES.find((m) => m.value === module)?.label ?? module;
}

const NONE: ModulePermissions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
};
const VIEW: ModulePermissions = { ...NONE, view: true };
const EDIT: ModulePermissions = {
  view: true,
  create: true,
  edit: true,
  delete: false,
};
const FULL: ModulePermissions = {
  view: true,
  create: true,
  edit: true,
  delete: true,
};

function withDefaults(
  overrides: Partial<Record<AppModule, ModulePermissions>>
): PermissionMap {
  return Object.fromEntries(
    MODULE_VALUES.map((m) => [m, overrides[m] ?? NONE])
  ) as Record<AppModule, ModulePermissions>;
}

/** Permessi predefiniti per i ruoli seminati alla creazione del workspace. */
export const DEFAULT_ROLE_PERMISSIONS: Record<
  Exclude<RoleKey, "custom">,
  PermissionMap
> = {
  admin: withDefaults(
    Object.fromEntries(MODULE_VALUES.map((m) => [m, FULL]))
  ),
  commerciale: withDefaults({
    contacts: FULL,
    orders_issued: FULL,
    orders_received: EDIT,
    invoices_issued: EDIT,
    invoices_received: VIEW,
    ddt: EDIT,
    warehouse: VIEW,
    jobs: EDIT,
    projects: VIEW,
  }),
  dipendente: withDefaults({
    contacts: VIEW,
    jobs: VIEW,
    projects: EDIT,
    warehouse: VIEW,
    hr: VIEW,
  }),
  marketing: withDefaults({
    contacts: EDIT,
    jobs: VIEW,
    projects: EDIT,
    iso: VIEW,
  }),
};

export const DEFAULT_ROLES: readonly {
  key: Exclude<RoleKey, "custom">;
  name: string;
  description: string;
  isSystem: boolean;
}[] = [
  {
    key: "admin",
    name: "Amministratore",
    description: "Accesso completo a tutti i moduli e alle impostazioni.",
    isSystem: true,
  },
  {
    key: "commerciale",
    name: "Commerciale",
    description: "Gestisce clienti, ordini, fatture e commesse.",
    isSystem: false,
  },
  {
    key: "dipendente",
    name: "Dipendente",
    description: "Consulta le informazioni e gestisce le proprie attività.",
    isSystem: false,
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Gestisce contatti e progetti di comunicazione.",
    isSystem: false,
  },
] as const;

export function emptyPermissionMap(): PermissionMap {
  return withDefaults({});
}
