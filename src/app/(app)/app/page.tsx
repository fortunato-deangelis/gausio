import { PageHeader } from "@/components/shared";
import { requireWorkspace } from "@/server/workspace";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { CommercialeDashboard } from "@/features/dashboard/components/commerciale-dashboard";
import { DipendenteDashboard } from "@/features/dashboard/components/dipendente-dashboard";
import { MarketingDashboard } from "@/features/dashboard/components/marketing-dashboard";

export const metadata = { title: "Dashboard" };

/** Dashboard: contenuto diverso in base al ruolo dell'utente. */
export default async function DashboardPage() {
  const ctx = await requireWorkspace();

  const greeting = ctx.userName?.split(" ")[0] ?? ctx.userEmail;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Ciao, ${greeting} 👋`}
        description={`Ecco la situazione di ${ctx.workspace.name} — vista ${ctx.role.name}.`}
      />
      {ctx.role.key === "admin" ? (
        <AdminDashboard workspaceId={ctx.workspace.id} />
      ) : ctx.role.key === "commerciale" ? (
        <CommercialeDashboard workspaceId={ctx.workspace.id} />
      ) : ctx.role.key === "marketing" ? (
        <MarketingDashboard workspaceId={ctx.workspace.id} />
      ) : (
        <DipendenteDashboard
          workspaceId={ctx.workspace.id}
          userId={ctx.userId}
        />
      )}
    </div>
  );
}
