import {
  Contact,
  KanbanSquare,
  Megaphone,
  UserPlus,
} from "lucide-react";
import { StatCard } from "@/components/shared";
import { getMarketingDashboardData } from "../queries";
import { TasksCard } from "./list-cards";

/** Dashboard marketing: contatti e progetti di comunicazione. */
export async function MarketingDashboard({
  workspaceId,
}: Readonly<{ workspaceId: string }>) {
  const data = await getMarketingDashboardData(workspaceId);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contatti totali"
          value={String(data.contactsTotal)}
          icon={Contact}
          tone="primary"
        />
        <StatCard
          label="Nuovi contatti (mese)"
          value={String(data.contactsNewMonth)}
          icon={UserPlus}
          tone="success"
        />
        <StatCard
          label="Progetti attivi"
          value={String(data.activeProjects)}
          icon={Megaphone}
          tone="info"
        />
        <StatCard
          label="Attività in corso"
          value={String(data.tasksInProgress)}
          icon={KanbanSquare}
          tone="warning"
        />
      </div>

      <TasksCard tasks={data.recentTasks} title="Ultime attività dei progetti" />
    </div>
  );
}
