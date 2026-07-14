import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { SettingsNav } from "@/features/workspaces/components/settings-nav";
import { RolePermissionsEditor } from "@/features/workspaces/components/role-permissions-editor";
import { listRolesWithPermissions } from "@/features/workspaces/queries";

export const metadata = { title: "Ruoli e permessi" };

/** Impostazioni → Ruoli e permessi per modulo. */
export default async function RuoliPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "settings", "view")) redirect("/app");

  const roles = await listRolesWithPermissions(ctx.workspace.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Impostazioni"
        description="Per ogni ruolo scegli cosa può vedere e fare in ciascun modulo."
      />
      <SettingsNav />
      <RolePermissionsEditor roles={roles} />
    </div>
  );
}
