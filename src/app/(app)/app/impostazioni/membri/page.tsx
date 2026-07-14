import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { SettingsNav } from "@/features/workspaces/components/settings-nav";
import { MembersManager } from "@/features/workspaces/components/members-manager";
import { listRoles } from "@/features/workspaces/actions";
import {
  listMembers,
  listPendingInvitations,
} from "@/features/workspaces/queries";

export const metadata = { title: "Membri" };

/** Impostazioni → Membri e inviti. */
export default async function MembriPage() {
  const ctx = await requireWorkspace();
  if (!can(ctx, "settings", "view")) redirect("/app");

  const [members, invitations, roles] = await Promise.all([
    listMembers(ctx.workspace.id),
    listPendingInvitations(ctx.workspace.id),
    listRoles(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Impostazioni"
        description="Gestisci il profilo aziendale, i membri e i permessi del workspace."
      />
      <SettingsNav />
      <MembersManager
        members={members}
        invitations={invitations}
        roleOptions={roles}
        currentUserId={ctx.userId}
        canEdit={can(ctx, "settings", "edit")}
        canDelete={can(ctx, "settings", "delete")}
        canInvite={can(ctx, "settings", "create")}
      />
    </div>
  );
}
