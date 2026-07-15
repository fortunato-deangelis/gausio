"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/shared/toast";
import { ShieldCheck } from "lucide-react";
import {
  AppCard,
  Button,
  Checkbox,
  Spinner,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared";
import {
  MODULES,
  type AppModule,
  type PermissionMap,
} from "@/server/auth/permissions";
import { updateRolePermissions } from "../actions";
import type { RoleWithPermissions } from "../queries";

type EditableMap = Record<
  AppModule,
  { view: boolean; create: boolean; edit: boolean; delete: boolean }
>;

const ACTIONS = [
  { key: "view", label: "Visualizza" },
  { key: "create", label: "Crea" },
  { key: "edit", label: "Modifica" },
  { key: "delete", label: "Elimina" },
] as const;

function clone(permissions: PermissionMap): EditableMap {
  return Object.fromEntries(
    Object.entries(permissions).map(([module, p]) => [module, { ...p }])
  ) as EditableMap;
}

/** Matrice permessi di un singolo ruolo. */
function RoleMatrix({ role }: Readonly<{ role: RoleWithPermissions }>) {
  const router = useRouter();
  const [map, setMap] = useState<EditableMap>(() => clone(role.permissions));
  const [saving, setSaving] = useState(false);
  const readOnly = role.key === "admin";

  const toggle = (
    module: AppModule,
    action: (typeof ACTIONS)[number]["key"],
    value: boolean
  ) => {
    setMap((prev) => {
      const next = { ...prev, [module]: { ...prev[module], [action]: value } };
      // Coerenza: senza "visualizza" gli altri permessi non hanno senso;
      // attivare crea/modifica/elimina implica visualizza.
      if (action === "view" && !value) {
        next[module] = { view: false, create: false, edit: false, delete: false };
      } else if (action !== "view" && value) {
        next[module].view = true;
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const result = await updateRolePermissions({
      roleId: role.id,
      permissions: Object.entries(map).map(([module, p]) => ({
        module,
        ...p,
      })),
    });
    setSaving(false);
    if (result.ok) {
      toast.success(`Permessi di "${role.name}" aggiornati.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AppCard
      title={
        <span className="flex items-center gap-2">
          {role.name}
          {role.isSystem && <StatusBadge label="Di sistema" tone="default" />}
        </span>
      }
      description={
        readOnly
          ? "L'amministratore ha sempre tutti i permessi: la matrice non è modificabile."
          : role.description ?? undefined
      }
      actions={
        readOnly ? undefined : (
          <Button onClick={save} disabled={saving} size="sm">
            {saving && <Spinner className="size-4" />}
            Salva
          </Button>
        )
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modulo</TableHead>
              {ACTIONS.map((action) => (
                <TableHead key={action.key} className="text-center">
                  {action.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map((module) => (
              <TableRow key={module.value}>
                <TableCell className="font-medium">{module.label}</TableCell>
                {ACTIONS.map((action) => (
                  <TableCell key={action.key} className="text-center">
                    <Checkbox
                      aria-label={`${action.label} ${module.label}`}
                      checked={
                        readOnly ? true : map[module.value][action.key]
                      }
                      disabled={readOnly}
                      onCheckedChange={(checked) =>
                        toggle(module.value, action.key, checked === true)
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppCard>
  );
}

/** Editor permessi per tutti i ruoli del workspace. */
export function RolePermissionsEditor({
  roles,
}: Readonly<{ roles: RoleWithPermissions[] }>) {
  if (roles.length === 0) {
    return (
      <AppCard title="Ruoli">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck aria-hidden className="size-4" />
          Nessun ruolo trovato per questo workspace.
        </p>
      </AppCard>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {roles.map((role) => (
        <RoleMatrix key={role.id} role={role} />
      ))}
    </div>
  );
}
